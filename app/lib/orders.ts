// Server-only: everything about creating and managing orders.
//
// The browser only ever says WHICH products and HOW MANY. Prices, stock, shipping and
// totals are always read and calculated here, from the database.
import { and, asc, desc, eq, gte, inArray, lt, sql } from "drizzle-orm"
import { customers, db, orderItems, orders, products } from "./db"
import { calculateShipping } from "./shipping"
import { PAYMENT_WINDOW_HOURS } from "./payment"
import { ADMIN_TRANSITIONS, type OrderStatus } from "./order-status"
import { getProfile } from "./profile"
import { isDuplicateError } from "./customers"
import type { CartLineInput, CreateOrderInput } from "./validations/order"

export class OrderError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message)
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Executor = typeof db | Tx

export type OrderRow = typeof orders.$inferSelect
export type OrderItemRow = typeof orderItems.$inferSelect
export type OrderWithItems = OrderRow & { items: OrderItemRow[] }

// ---- pricing -------------------------------------------------------------

export interface QuoteLine {
  productId: string
  slug: string
  name: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  maxQuantity: number
  lineTotal: number
}
export interface QuoteIssue {
  productId: string
  name: string
  message: string
}
export interface Quote {
  lines: QuoteLine[]
  issues: QuoteIssue[]
  subtotal: number
  shippingFee: number
  total: number
}

// the same product listed twice in a bag becomes one line
function mergeLines(items: CartLineInput[]) {
  const wanted = new Map<string, number>()
  for (const { productId, quantity } of items) {
    wanted.set(productId, Math.min(10, (wanted.get(productId) ?? 0) + quantity))
  }
  return wanted
}

// `lock` keeps the product rows still while an order is being created
export async function quoteCart(items: CartLineInput[], executor: Executor = db, lock = false): Promise<Quote> {
  const wanted = mergeLines(items)
  const ids = [...wanted.keys()].sort()

  const query = executor.select().from(products).where(inArray(products.id, ids)).orderBy(asc(products.id))
  const rows = ids.length === 0 ? [] : lock ? await query.for("update") : await query
  const byId = new Map(rows.map((r) => [r.id, r]))

  const lines: QuoteLine[] = []
  const issues: QuoteIssue[] = []

  for (const id of ids) {
    const row = byId.get(id)
    const quantity = wanted.get(id)!
    if (!row || !row.isAvailable) {
      issues.push({ productId: id, name: row?.name ?? "An item in your bag", message: "is no longer available" })
      continue
    }
    if (row.stock <= 0) {
      issues.push({ productId: id, name: row.name, message: "is sold out" })
      continue
    }
    if (quantity > row.stock) {
      issues.push({ productId: id, name: row.name, message: `has only ${row.stock} left` })
    }
    lines.push({
      productId: row.id,
      slug: row.slug,
      name: row.name,
      imageUrl: row.imageUrl,
      unitPrice: row.price,
      quantity,
      maxQuantity: Math.min(10, row.stock),
      lineTotal: row.price * quantity,
    })
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  const shippingFee = lines.length ? calculateShipping(subtotal) : 0
  return { lines, issues, subtotal, shippingFee, total: subtotal + shippingFee }
}

// ---- stock ---------------------------------------------------------------

async function restock(tx: Tx, orderId: string) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId))
  for (const item of items) {
    if (!item.productId) continue // the product was deleted since
    await tx
      .update(products)
      .set({ stock: sql`${products.stock} + ${item.quantity}` })
      .where(eq(products.id, item.productId))
  }
}

// Unpaid orders are cancelled after PAYMENT_WINDOW_HOURS and their stock is released.
// Run before orders are read or created, so no scheduled job is needed.
export async function expireStaleOrders() {
  await db.transaction(async (tx) => {
    const expired = await tx
      .update(orders)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(and(eq(orders.status, "pending_payment"), lt(orders.expiresAt, new Date())))
      .returning({ id: orders.id })
    for (const { id } of expired) await restock(tx, id)
  })
}

// ---- creating an order -----------------------------------------------------

const NUMBER_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no 0/O or 1/I to avoid misreading

function generateOrderNumber() {
  const day = new Date(Date.now() + 7 * 3600_000).toISOString().slice(2, 10).replace(/-/g, "") // Jakarta date
  const random = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => NUMBER_CHARS[b % NUMBER_CHARS.length])
  return `SCL-${day}-${random.join("")}`
}

export async function createOrder(customerId: string, input: CreateOrderInput) {
  await expireStaleOrders()

  const profile = await getProfile(customerId)
  if (!profile) throw new OrderError("Account not found. Please sign in again.", 401)
  if (!profile.address || !profile.provinceCode || !profile.cityCode || !profile.districtCode) {
    throw new OrderError("Add your delivery address in your profile before checking out.", 400)
  }

  const attempt = () =>
    db.transaction(async (tx) => {
      const quote = await quoteCart(input.items, tx, true)
      if (quote.issues.length) {
        const first = quote.issues[0]
        throw new OrderError(`${first.name} ${first.message}. Please update your bag.`, 409)
      }

      // take the stock; the WHERE clause makes it impossible to go below zero
      for (const line of quote.lines) {
        const taken = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${line.quantity}` })
          .where(and(eq(products.id, line.productId), gte(products.stock, line.quantity)))
          .returning({ id: products.id })
        if (!taken.length) throw new OrderError(`${line.name} has just sold out. Please update your bag.`, 409)
      }

      const orderNumber = generateOrderNumber()
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerId,
          status: "pending_payment",
          paymentMethod: input.paymentMethod,
          subtotal: quote.subtotal,
          shippingFee: quote.shippingFee,
          total: quote.total,
          note: input.note || null,
          customerName: profile.name || profile.email,
          customerEmail: profile.email,
          customerPhone: input.phone,
          shipAddress: profile.address,
          shipProvince: profile.province,
          shipCity: profile.city,
          shipDistrict: profile.district,
          shipPostalCode: profile.postalCode || null,
          expiresAt: new Date(Date.now() + PAYMENT_WINDOW_HOURS * 3600_000),
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber })

      await tx.insert(orderItems).values(
        quote.lines.map((l) => ({
          orderId: order.id,
          productId: l.productId,
          productName: l.name,
          productSlug: l.slug,
          imageUrl: l.imageUrl,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
        }))
      )

      // remember the phone number for next time
      if (!profile.phone) await tx.update(customers).set({ phone: input.phone }).where(eq(customers.id, customerId))

      return order
    })

  // an order-number clash is astronomically unlikely, but retrying is cheap
  for (let i = 0; ; i++) {
    try {
      return await attempt()
    } catch (error) {
      if (isDuplicateError(error) && i < 2) continue
      throw error
    }
  }
}

// ---- reading orders ------------------------------------------------------------

async function withItems(rows: OrderRow[]): Promise<OrderWithItems[]> {
  if (rows.length === 0) return []
  const items = await db
    .select()
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((r) => r.id)
      )
    )
  const byOrder = new Map<string, OrderItemRow[]>()
  for (const item of items) byOrder.set(item.orderId, [...(byOrder.get(item.orderId) ?? []), item])
  return rows.map((r) => ({ ...r, items: byOrder.get(r.id) ?? [] }))
}

export async function getCustomerOrders(customerId: string) {
  await expireStaleOrders()
  const rows = await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt))
  return withItems(rows)
}

// scoped to the customer, so one customer can never open another's order
export async function getCustomerOrder(customerId: string, orderNumber: string) {
  await expireStaleOrders()
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.customerId, customerId), eq(orders.orderNumber, orderNumber)))
    .limit(1)
  return (await withItems(rows))[0] ?? null
}

export async function getAdminOrders(status?: OrderStatus) {
  await expireStaleOrders()
  const rows = await db
    .select()
    .from(orders)
    .where(status ? eq(orders.status, status) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(200)
  return withItems(rows)
}

export async function getAdminOrder(id: string) {
  await expireStaleOrders()
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  return (await withItems(rows))[0] ?? null
}

// ---- changing orders ---------------------------------------------------------------

export async function cancelCustomerOrder(customerId: string, orderNumber: string) {
  await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.customerId, customerId), eq(orders.orderNumber, orderNumber)))
      .for("update")
    if (!order) throw new OrderError("Order not found", 404)
    if (order.status !== "pending_payment") {
      throw new OrderError("Only orders that are awaiting payment can be cancelled. Please contact us for help.", 409)
    }
    await tx.update(orders).set({ status: "cancelled", cancelledAt: new Date() }).where(eq(orders.id, order.id))
    await restock(tx, order.id)
  })
}

export async function updateOrderStatus(id: string, next: OrderStatus, trackingNumber?: string) {
  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update")
    if (!order) throw new OrderError("Order not found", 404)

    const current = order.status as OrderStatus
    if (!ADMIN_TRANSITIONS[current]?.includes(next)) {
      throw new OrderError(`An order that is "${current}" cannot be changed to "${next}".`, 409)
    }

    const now = new Date()
    await tx
      .update(orders)
      .set({
        status: next,
        ...(next === "paid" && { paidAt: now }),
        ...(next === "shipped" && { shippedAt: now, trackingNumber: trackingNumber || order.trackingNumber }),
        ...(next === "delivered" && { deliveredAt: now }),
        ...(next === "cancelled" && { cancelledAt: now }),
      })
      .where(eq(orders.id, id))

    if (next === "cancelled") await restock(tx, id)
  })
}
