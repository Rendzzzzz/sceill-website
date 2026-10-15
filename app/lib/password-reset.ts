// Server-only: changing a forgotten password WITHOUT an email.
//
//  1. requestPasswordReset  -> checks the email, and if it can be reset, returns a short-lived token
//  2. resetPassword         -> uses that token to save the new password
//
// IMPORTANT: nothing here proves the person is the owner of the account. Whoever knows an
// email address can change that account's password. Because of that, admin accounts are
// refused (they reset with `npm run db:reset-password`). To make this safe for everyone, add a
// proof of ownership between step 1 and step 2: an email link (lib/mail.ts is still here for
// that), a phone code, or similar.
//
// The token is 256 random bits, valid RESET_VALID_MINUTES, usable once; only its SHA-256 hash is
// stored. A new check cancels the older token for the same account.
import { createHash, randomBytes } from "crypto"
import { and, count, eq, gt, isNull, lt } from "drizzle-orm"
import { customerCredentials, customers, db, passwordResetTokens } from "./db"
import { findCustomerByEmail, getPasswordHash, hashPassword } from "./customers"

export const RESET_VALID_MINUTES = 10
const MAX_REQUESTS_PER_HOUR = 10

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex")

export type ResetRequest =
  | { status: "not_found" }
  | { status: "social" } // Google/Apple account: there is no password to change
  | { status: "admin" } // admins cannot be reset from the website
  | { status: "throttled" }
  | { status: "found"; email: string; token: string }

export async function requestPasswordReset(email: string): Promise<ResetRequest> {
  const customer = await findCustomerByEmail(email)
  if (!customer) return { status: "not_found" }
  if (customer.role === "admin") return { status: "admin" }
  if (!(await getPasswordHash(customer.id))) return { status: "social" }

  const now = new Date()
  const hourAgo = new Date(now.getTime() - 3600_000)

  // old rows are only kept to count recent requests, so tidy up anything over a week old
  await db.delete(passwordResetTokens).where(lt(passwordResetTokens.createdAt, new Date(now.getTime() - 7 * 86400_000)))

  const [{ recent }] = await db
    .select({ recent: count() })
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.customerId, customer.id), gt(passwordResetTokens.createdAt, hourAgo)))
  if (recent >= MAX_REQUESTS_PER_HOUR) return { status: "throttled" }

  const token = randomBytes(32).toString("base64url")
  await db.transaction(async (tx) => {
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(and(eq(passwordResetTokens.customerId, customer.id), isNull(passwordResetTokens.usedAt)))
    await tx.insert(passwordResetTokens).values({
      customerId: customer.id,
      tokenHash: sha256(token),
      expiresAt: new Date(now.getTime() + RESET_VALID_MINUTES * 60_000),
    })
  })

  return { status: "found", email: customer.email, token }
}

// Returns who it was for, or null when the token is invalid, expired, already used, or belongs
// to an admin / an account without a password
export async function resetPassword(token: string, newPassword: string) {
  if (!token || token.length > 200) return null
  const passwordHash = await hashPassword(newPassword)

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.tokenHash, sha256(token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())))
      .for("update")
    if (!row) return null

    const [customer] = await tx
      .select({ email: customers.email, name: customers.name, role: customers.role })
      .from(customers)
      .where(eq(customers.id, row.customerId))
    // checked again here, in case the account was made an admin after the token was issued
    if (!customer || customer.role === "admin") return null

    const updated = await tx
      .update(customerCredentials)
      .set({ passwordHash })
      .where(eq(customerCredentials.customerId, row.customerId))
      .returning({ id: customerCredentials.customerId })
    if (!updated.length) return null

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.customerId, row.customerId), isNull(passwordResetTokens.usedAt)))

    return { email: customer.email, name: customer.name || "there" }
  })
}
