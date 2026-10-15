// Gives an existing account admin rights (access to /admin).
//   npm run db:make-admin -- you@example.com
// Register the account on the site first, then run this once.
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  if (!email) {
    console.error("Usage: npm run db:make-admin -- you@example.com")
    process.exit(1)
  }

  const { db, customers } = await import("../app/lib/db")
  const { eq, sql } = await import("drizzle-orm")

  const [found] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(sql`lower(${customers.email}) = ${email}`)
    .limit(1)
  if (!found) {
    console.error(`No account with email ${email}. Register it on the site first.`)
    process.exit(1)
  }

  await db.update(customers).set({ role: "admin" }).where(eq(customers.id, found.id))
  console.log(`${email} is now an admin. Sign out and back in for it to take effect.`)
  process.exit(0)
}

main().catch((error) => {
  console.error("Failed:", error.message ?? error)
  process.exit(1)
})
