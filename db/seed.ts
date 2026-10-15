// Sample data so a fresh database is not an empty shop. Safe to run again:
// rows whose slug already exists are left untouched.
//   npm run db:seed
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

async function main() {
  const { db, products, promos, blogPosts } = await import("../app/lib/db")

  const perfumes = [
    ["Noir Absolu", "noir-absolu", "Oriental", 1450000, "Smoked oud, black amber and a whisper of saffron. A deep, magnetic evening signature.", 12],
    ["Lumière Blanche", "lumiere-blanche", "Floral", 1250000, "Jasmine sambac, white peony and soft musk. Luminous, airy and effortlessly elegant.", 12],
    ["Vetiver Éclat", "vetiver-eclat", "Woody", 1350000, "Haitian vetiver, cedar and bergamot zest. Crisp, refined and quietly confident.", 12],
    ["Rose Éternelle", "rose-eternelle", "Floral", 1550000, "Damask rose, pink pepper and golden honey. A romantic classic reimagined.", 4],
    ["Citrus Reverie", "citrus-reverie", "Fresh", 1100000, "Sicilian lemon, neroli and green tea. A bright, sparkling escape.", 12],
    ["Santal Velours", "santal-velours", "Woody", 1650000, "Creamy sandalwood, tonka bean and suede. Warm, enveloping and unforgettable.", 12],
  ] as const

  await db
    .insert(products)
    .values(
      perfumes.map(([name, slug, category, price, description, stock]) => ({
        name, slug, category, price, description, stock, isAvailable: true,
      }))
    )
    .onConflictDoNothing()

  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  await db
    .insert(promos)
    .values({
      title: "Welcome Offer",
      slug: "welcome-offer",
      description: "Enjoy 10% off your first order, with complimentary samples.",
      discountPercent: 10,
      startDate: iso(today),
      endDate: iso(nextMonth),
      isActive: true,
    })
    .onConflictDoNothing()

  await db
    .insert(blogPosts)
    .values({
      title: "How to Choose Your Signature Scent",
      slug: "choose-your-signature-scent",
      excerpt: "Notes, families and skin chemistry: a short guide to finding the fragrance that feels like you.",
      content: "",
      author: "SCEILL",
      category: "Guide",
      isPublished: true,
    })
    .onConflictDoNothing()

  console.log("Seed complete: sample perfumes, a promo and a blog post are in the database.")
  process.exit(0)
}

main().catch((error) => {
  console.error("Seed failed:", error.message ?? error)
  process.exit(1)
})
