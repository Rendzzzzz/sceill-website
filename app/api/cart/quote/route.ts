import { NextResponse } from "next/server"
import { quoteCart } from "../../../lib/orders"
import { quoteSchema } from "../../../lib/validations/order"
import { validationError } from "../../../lib/admin"
import { orderErrorResponse } from "../../../lib/order-errors"

// Current prices and stock for a bag, so the checkout page shows the real numbers.
export async function POST(request: Request) {
  const parsed = quoteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.issues)

  try {
    return NextResponse.json(await quoteCart(parsed.data.items))
  } catch (error) {
    return orderErrorResponse(error, "quote")
  }
}
