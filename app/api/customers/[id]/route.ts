// app/api/customers/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { customers, db } from "../../../lib/db"
import { authOptions } from "../../../lib/auth"
import { toCustomerJson } from "../../../lib/customer-json"
import { validationError } from "../../../lib/admin"

type Context = { params: Promise<{ id: string }> }

// A customer may act on their own record; an admin may act on any.
async function authorize(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (session.user.id !== id && session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { session }
}

// Only these fields can be changed here. role, email and id are deliberately absent.
const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  address: z.string().trim().min(10).max(255).optional(),
  postal_code: z.string().trim().max(10).nullable().optional(),
})

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  const auth = await authorize(id)
  if (auth.error) return auth.error

  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1)
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(toCustomerJson(row))
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params
  const auth = await authorize(id)
  if (auth.error) return auth.error

  const parsed = updateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.issues)
  const { name, phone, address, postal_code } = parsed.data

  const changes = {
    ...(name !== undefined && { name }),
    ...(phone !== undefined && { phone }),
    ...(address !== undefined && { address }),
    ...(postal_code !== undefined && { postalCode: postal_code }),
  }
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  await db.update(customers).set(changes).where(eq(customers.id, id))
  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1)
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(toCustomerJson(row))
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params
  const auth = await authorize(id)
  if (auth.error) return auth.error

  // the password row is removed automatically (ON DELETE CASCADE)
  await db.delete(customers).where(eq(customers.id, id))
  return NextResponse.json({ success: true })
}
