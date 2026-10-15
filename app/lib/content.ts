// Promotions and blog posts shown on the public site.
import { desc, eq } from "drizzle-orm"
import { blogPosts, db, promos } from "./db"

export async function getActivePromos() {
  try {
    return await db.select().from(promos).where(eq(promos.isActive, true)).orderBy(desc(promos.createdAt))
  } catch (error) {
    console.error('getActivePromos failed', error)
    return []
  }
}

export async function getPublishedPosts() {
  try {
    return await db.select().from(blogPosts).where(eq(blogPosts.isPublished, true)).orderBy(desc(blogPosts.createdAt))
  } catch (error) {
    console.error('getPublishedPosts failed', error)
    return []
  }
}
