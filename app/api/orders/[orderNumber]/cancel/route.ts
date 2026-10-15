import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { cancelCustomerOrder } from "../../../../lib/orders"
import { orderErrorResponse } from "../../../../lib/order-errors"

export async function POST(_request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orderNumber } = await params
  try {
    await cancelCustomerOrder(session.user.id, orderNumber)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return orderErrorResponse(error, "cancel order")
  }
}
