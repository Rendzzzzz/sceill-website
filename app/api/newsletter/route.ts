import { NextResponse } from "next/server"
import { z } from "zod"
import { db, newsletterSubscribers } from "../../lib/db"
import { isDuplicateError } from "../../lib/customers"

const schema = z.object({ email: z.email().max(254) })

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse({ email: String(body?.email ?? "").trim().toLowerCase() })
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
  }

  try {
    await db.insert(newsletterSubscribers).values({ email: parsed.data.email })
  } catch (error) {
    // already subscribed is still a success from the visitor's point of view
    if (!isDuplicateError(error)) {
      console.error("newsletter failed", error)
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
    }
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
