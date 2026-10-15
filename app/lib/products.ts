import { and, asc, desc, eq, ilike, ne, or, sql } from "drizzle-orm"
import { db, products } from "./db"
import type { Product } from "../types"

export type ProductSort = 'newest' | 'price-asc' | 'price-desc' | 'name'

export interface ProductFilters {
  category?: string
  q?: string
  sort?: ProductSort
  limit?: number
}

type ProductRow = typeof products.$inferSelect

// Components use snake_case field names (they were written for the old API), so map once here
function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    category: row.category,
    image_url: row.imageUrl ?? '',
    stock: row.stock,
    is_available: row.isAvailable,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

// % and _ are wildcards in LIKE, so escape them in what the visitor typed (ilike = ignores case)
const escapeLike = (v: string) => v.replace(/[\\%_]/g, '\\$&')

const ORDER = {
  newest: desc(products.createdAt),
  'price-asc': asc(products.price),
  'price-desc': desc(products.price),
  name: asc(products.name),
} as const

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  try {
    const q = filters.q?.trim()
    const pattern = q ? `%${escapeLike(q)}%` : null

    const rows = await db
      .select()
      .from(products)
      .where(
        and(
          filters.category ? eq(products.category, filters.category) : undefined,
          pattern
            ? or(ilike(products.name, pattern), ilike(products.description, pattern), ilike(products.category, pattern))
            : undefined
        )
      )
      .orderBy(ORDER[filters.sort ?? 'newest'])
      .limit(filters.limit ?? 200)

    return rows.map(toProduct)
  } catch (error) {
    // a database outage should show an empty shelf, not a crashed page
    console.error('getProducts failed', error)
    return []
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const rows = await db.selectDistinct({ category: products.category }).from(products).orderBy(asc(products.category))
    return rows.map((r) => r.category).filter(Boolean)
  } catch (error) {
    console.error('getCategories failed', error)
    return []
  }
}

export async function getProduct(slugOrId: string): Promise<Product | null> {
  try {
    // rows saved without a nice slug can still be opened by id
    const [row] = await db
      .select()
      .from(products)
      .where(or(eq(products.slug, slugOrId), eq(products.id, slugOrId)))
      .limit(1)
    return row ? toProduct(row) : null
  } catch (error) {
    console.error('getProduct failed', error)
    return null
  }
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  try {
    const sameCategory = await db
      .select()
      .from(products)
      .where(and(eq(products.category, product.category), ne(products.id, product.id)))
      .orderBy(sql`random()`)
      .limit(limit)

    const related = sameCategory.map(toProduct)
    if (related.length >= limit) return related

    const others = await db
      .select()
      .from(products)
      .where(and(ne(products.category, product.category), ne(products.id, product.id)))
      .orderBy(desc(products.createdAt))
      .limit(limit - related.length)
    return [...related, ...others.map(toProduct)]
  } catch (error) {
    console.error('getRelatedProducts failed', error)
    return []
  }
}

export function productHref(p: Pick<Product, 'slug' | 'id'>) {
  return `/product/${p.slug || p.id}`
}
