import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"
import { createOrder } from "../../lib/orders"
import { createOrderSchema } from "../../lib/validations/order"
import { validationError } from "../../lib/admin"
import { orderErrorResponse } from "../../lib/order-errors"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 })

  const parsed = createOrderSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.issues)

  try {
    const order = await createOrder(session.user.id, parsed.data)
    return NextResponse.json({ orderNumber: order.orderNumber }, { status: 201 })
  } catch (error) {
    return orderErrorResponse(error, "create order")
  }
}
