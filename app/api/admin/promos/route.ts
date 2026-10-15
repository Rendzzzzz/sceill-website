import { NextResponse } from "next/server"
import { z } from "zod"
import { desc } from "drizzle-orm"
import { db, promos } from "../../../lib/db"
import { requireAdmin, validationError } from "../../../lib/admin"
import { isDuplicateError } from "../../../lib/customers"

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")

const promoSchema = z
  .object({
    title: z.string().trim().min(1, "Enter a title").max(200),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes").max(200),
    description: z.string().trim().min(1, "Enter a description"),
    discount_percent: z.coerce.number().int("Discount must be a whole number").min(1, "Discount must be at least 1%").max(100, "Discount cannot exceed 100%"),
    start_date: day,
    end_date: day,
    image_url: z.string().trim().max(500).refine((v) => v === "" || /^https?:\/\//i.test(v), "Image must be an http(s) link").optional(),
    is_active: z.boolean().default(true),
  })
  .refine((v) => v.end_date >= v.start_date, { path: ["end_date"], message: "End date must not be before the start date" })

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const rows = await db.select().from(promos).orderBy(desc(promos.createdAt))
  return NextResponse.json(
    rows.map((p) => ({
      id: p.id,
      title: p.title,
      discount_percent: p.discountPercent,
      is_active: p.isActive,
      start_date: p.startDate,
      end_date: p.endDate,
    }))
  )
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const parsed = promoSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.issues)
  const v = parsed.data

  try {
    await db.insert(promos).values({
      title: v.title,
      slug: v.slug,
      description: v.description,
      discountPercent: v.discount_percent,
      startDate: v.start_date,
      endDate: v.end_date,
      imageUrl: v.image_url || null,
      isActive: v.is_active,
    })
  } catch (error) {
    if (isDuplicateError(error)) {
      return NextResponse.json({ error: "That slug is already used by another promo" }, { status: 409 })
    }
    console.error("create promo failed", error)
    return NextResponse.json({ error: "Could not save the promo" }, { status: 500 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
