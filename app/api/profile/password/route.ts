import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { eq } from "drizzle-orm"
import { authOptions } from "../../../lib/auth"
import { customerCredentials, db } from "../../../lib/db"
import { getPasswordHash, hashPassword, verifyPassword } from "../../../lib/customers"
import { validationError } from "../../../lib/admin"
import { passwordChangeSchema } from "../../../lib/validations/profile"

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  const id = session?.user.id
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = passwordChangeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.issues)
  const { currentPassword, newPassword } = parsed.data

  // Google / Apple accounts have no password to change
  const hash = await getPasswordHash(id)
  if (!hash) {
    return NextResponse.json({ error: "This account signs in with Google or Apple and has no password." }, { status: 400 })
  }

  if (!(await verifyPassword(currentPassword, hash))) {
    return NextResponse.json({ error: "currentPassword: Your current password is incorrect" }, { status: 400 })
  }

  await db
    .update(customerCredentials)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(customerCredentials.customerId, id))

  return NextResponse.json({ ok: true })
}
