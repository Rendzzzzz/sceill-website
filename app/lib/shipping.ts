// Shipping and cart limits. Used by both the browser (to show the numbers) and the
// server (to calculate the real ones).
export const FREE_SHIPPING_THRESHOLD = 1_500_000
export const SHIPPING_FEE = 25_000
export const MAX_QUANTITY_PER_ITEM = 10

export function calculateShipping(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
}
