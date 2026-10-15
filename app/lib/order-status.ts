// Order statuses, shared by the browser and the server.
export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const isOrderStatus = (v: unknown): v is OrderStatus =>
  typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v)

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  processing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export const STATUS_TONE: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-900",
  paid: "bg-sky-100 text-sky-900",
  processing: "bg-indigo-100 text-indigo-900",
  shipped: "bg-violet-100 text-violet-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-stone-200 text-stone-700",
}

// What an admin may move an order to from each status
export const ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
}

// The steps shown on the customer's order timeline
export const TIMELINE: OrderStatus[] = ["pending_payment", "paid", "processing", "shipped", "delivered"]
