// Resets the password of ANY account, including admins (the website refuses admins on purpose).
//   npm run db:reset-password -- you@example.com
// It prints a temporary password once. Sign in with it, then change it on the profile page.
import { randomInt } from "node:crypto"
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

// no 0/O, 1/l/I, so the password can be read aloud and typed without mistakes
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
const DIGITS = "23456789"

function temporaryPassword() {
  const pick = (set: string) => set[randomInt(set.length)]
  const chars = [...Array.from({ length: 10 }, () => pick(LETTERS + DIGITS)), pick(LETTERS), pick(DIGITS)]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join("")
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  if (!email) {
    console.error("Usage: npm run db:reset-password -- you@example.com")
    process.exit(1)
  }

  const { db, customers, customerCredentials, passwordResetTokens } = await import("../app/lib/db")
  const { hashPassword } = await import("../app/lib/customers")
  const { eq, sql } = await import("drizzle-orm")

  const [found] = await db
    .select({ id: customers.id, role: customers.role })
    .from(customers)
    .where(sql`lower(${customers.email}) = ${email}`)
    .limit(1)
  if (!found) {
    console.error(`No account with email ${email}.`)
    process.exit(1)
  }

  const password = temporaryPassword()
  const passwordHash = await hashPassword(password)
  await db
    .insert(customerCredentials)
    .values({ customerId: found.id, passwordHash })
    .onConflictDoUpdate({ target: customerCredentials.customerId, set: { passwordHash } })
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.customerId, found.id))

  console.log(`\nPassword reset for ${email} (${found.role}).`)
  console.log(`Temporary password:  ${password}`)
  console.log("Sign in with it, then change it on the profile page. It is not shown again.\n")
  process.exit(0)
}

main().catch((error) => {
  console.error("Failed:", error.message ?? error)
  process.exit(1)
})
