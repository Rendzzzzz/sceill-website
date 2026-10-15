import { NextResponse } from "next/server"
import { z } from "zod"
import { desc } from "drizzle-orm"
import { db, products } from "../../../lib/db"
import { requireAdmin, validationError } from "../../../lib/admin"
import { isDuplicateError } from "../../../lib/customers"

const productSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(200),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes").max(200),
  description: z.string().trim().min(1, "Enter a description"),
  price: z.coerce.number().int("Price must be a whole number").min(0).max(2_000_000_000),
  category: z.string().trim().min(1, "Enter a category").max(100),
  stock: z.coerce.number().int("Stock must be a whole number").min(0).max(1_000_000),
  image_url: z.string().trim().max(500).refine((v) => v === "" || /^https?:\/\//i.test(v), "Image must be an http(s) link").optional(),
  is_available: z.boolean().default(true),
})

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const rows = await db.select().from(products).orderBy(desc(products.createdAt))
  return NextResponse.json(
    rows.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      is_available: p.isAvailable,
      category: p.category,
    }))
  )
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const parsed = productSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.issues)
  const v = parsed.data

  try {
    await db.insert(products).values({
      name: v.name,
      slug: v.slug,
      description: v.description,
      price: v.price,
      category: v.category,
      stock: v.stock,
      imageUrl: v.image_url || null,
      isAvailable: v.is_available,
    })
  } catch (error) {
    if (isDuplicateError(error)) {
      return NextResponse.json({ error: "That slug is already used by another product" }, { status: 409 })
    }
    console.error("create product failed", error)
    return NextResponse.json({ error: "Could not save the product" }, { status: 500 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
