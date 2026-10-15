// app/api/customers/route.ts
// Customer accounts are created by /api/register and by Google/Apple sign-in,
// so this route only lists them, and only for admins.
import { NextResponse } from "next/server"
import { desc } from "drizzle-orm"
import { customers, db } from "../../lib/db"
import { requireAdmin } from "../../lib/admin"
import { toCustomerJson } from "../../lib/customer-json"

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const rows = await db.select().from(customers).orderBy(desc(customers.createdAt))
  return NextResponse.json(rows.map(toCustomerJson))
}
