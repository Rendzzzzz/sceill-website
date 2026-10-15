import { NextResponse } from "next/server"
import { requireAdmin, validationError } from "../../../../lib/admin"
import { updateOrderStatus } from "../../../../lib/orders"
import { adminOrderUpdateSchema } from "../../../../lib/validations/order"
import { orderErrorResponse } from "../../../../lib/order-errors"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const parsed = adminOrderUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.issues)

  const { id } = await params
  try {
    await updateOrderStatus(id, parsed.data.status, parsed.data.trackingNumber)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return orderErrorResponse(error, "update order")
  }
}
