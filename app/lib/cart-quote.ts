import { MAX_QUANTITY_PER_ITEM } from "./shipping"

export interface CartQuoteInput {
  productId: string
  quantity: number
}

export interface CartQuoteProduct {
  id: string
  slug: string
  name: string
  imageUrl: string | null
  price: number
  stock: number
  isAvailable: boolean
}

export interface CartQuoteLine {
  productId: string
  slug: string
  name: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  maxQuantity: number
  lineTotal: number
}

export interface CartQuoteIssue {
  productId: string
  name: string
  message: string
}

export interface CartQuoteResult {
  lines: CartQuoteLine[]
  issues: CartQuoteIssue[]
  subtotal: number
  shippingFee: number
  total: number
}

/** Pure cart-pricing logic; product data and shipping policy are supplied by the caller. */
export function buildCartQuote(
  items: CartQuoteInput[],
  products: CartQuoteProduct[],
  shippingCalculator: (subtotal: number) => number
): CartQuoteResult {
  const wanted = new Map<string, number>()
  for (const { productId, quantity } of items) {
    wanted.set(productId, Math.min(MAX_QUANTITY_PER_ITEM, (wanted.get(productId) ?? 0) + quantity))
  }

  const byId = new Map(products.map((product) => [product.id, product]))
  const lines: CartQuoteLine[] = []
  const issues: CartQuoteIssue[] = []

  for (const [id, quantity] of [...wanted.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const product = byId.get(id)
    if (!product || !product.isAvailable) {
      issues.push({ productId: id, name: product?.name ?? "An item in your bag", message: "is no longer available" })
      continue
    }
    if (product.stock <= 0) {
      issues.push({ productId: id, name: product.name, message: "is sold out" })
      continue
    }
    if (quantity > product.stock) {
      issues.push({ productId: id, name: product.name, message: `has only ${product.stock} left` })
    }
    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      unitPrice: product.price,
      quantity,
      maxQuantity: Math.min(MAX_QUANTITY_PER_ITEM, product.stock),
      lineTotal: product.price * quantity,
    })
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const shippingFee = lines.length ? shippingCalculator(subtotal) : 0
  return { lines, issues, subtotal, shippingFee, total: subtotal + shippingFee }
}
