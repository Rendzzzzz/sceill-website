// Server-only: gate for admin API routes. The page-level redirect in proxy.ts
// is a convenience; this is the check that actually protects the data.
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "./auth"

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  if (session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { session }
}

export function validationError(issues: { path: PropertyKey[]; message: string }[]) {
  const first = issues[0]
  const field = first?.path.length ? `${String(first.path[0])}: ` : ""
  return NextResponse.json({ error: `${field}${first?.message ?? "Invalid input"}` }, { status: 400 })
}
