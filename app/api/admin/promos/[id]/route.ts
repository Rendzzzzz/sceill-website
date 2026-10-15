import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db, promos } from "../../../../lib/db"
import { requireAdmin } from "../../../../lib/admin"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  await db.delete(promos).where(eq(promos.id, id))
  return NextResponse.json({ ok: true })
}
