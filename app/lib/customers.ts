// Server-only helpers for the customers / customer_credentials tables.
import bcrypt from "bcryptjs"
import { eq, sql } from "drizzle-orm"
import { customerCredentials, customers, db } from "./db"

export interface CustomerRecord {
  id: string
  email: string
  name: string | null
  role: string
}

const BCRYPT_COST = 12

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST)
}

// A real hash to compare against when the email is unknown, so a login attempt
// takes about the same time whether or not the account exists.
let dummyHash: Promise<string> | null = null
export async function verifyPassword(password: string, hash: string | null) {
  dummyHash ??= bcrypt.hash("sceill-timing-pad", BCRYPT_COST)
  const ok = await bcrypt.compare(password, hash ?? (await dummyHash))
  return hash !== null && ok
}

// PostgreSQL error 23505: a UNIQUE index rejected the row (e.g. the email is taken).
// Drizzle wraps driver errors, so look at `cause` too.
export function isDuplicateError(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } }
  return [e, e?.cause].some((x) => x?.code === "23505")
}

// PostgreSQL compares text case-sensitively, so emails are always matched in lower case
export const emailEquals = (email: string) => sql`lower(${customers.email}) = ${email.toLowerCase()}`

const customerColumns = {
  id: customers.id,
  email: customers.email,
  name: customers.name,
  role: customers.role,
}

export async function findCustomerByEmail(email: string): Promise<CustomerRecord | null> {
  const [row] = await db.select(customerColumns).from(customers).where(emailEquals(email)).limit(1)
  return row ?? null
}

export async function findCustomerById(id: string): Promise<CustomerRecord | null> {
  const [row] = await db.select(customerColumns).from(customers).where(eq(customers.id, id)).limit(1)
  return row ?? null
}

export async function getPasswordHash(customerId: string): Promise<string | null> {
  const [row] = await db
    .select({ hash: customerCredentials.passwordHash })
    .from(customerCredentials)
    .where(eq(customerCredentials.customerId, customerId))
    .limit(1)
  return row?.hash ?? null
}

export interface CustomerAddress {
  address: string
  province: string
  city: string
  district: string
  provinceCode: string
  cityCode: string
  districtCode: string
}

export async function createCustomerWithPassword(input: {
  name: string
  email: string
  passwordHash: string
  address: CustomerAddress
}): Promise<CustomerRecord> {
  const id = crypto.randomUUID()

  // one transaction: either the customer and their password both exist, or neither does
  await db.transaction(async (tx) => {
    await tx.insert(customers).values({
      id,
      email: input.email.toLowerCase(),
      name: input.name,
      role: "user",
      ...input.address,
    })
    await tx.insert(customerCredentials).values({ customerId: id, passwordHash: input.passwordHash })
  })

  return { id, email: input.email.toLowerCase(), name: input.name, role: "user" }
}

// Used for Google / Apple sign-in: the provider has verified the email address.
export async function findOrCreateOAuthCustomer(input: {
  email: string
  name?: string | null
}): Promise<CustomerRecord> {
  const existing = await findCustomerByEmail(input.email)
  if (existing) {
    // Registered email/password accounts are not email-verified. If the real
    // owner now proves the address through Google/Apple, drop any password set
    // by whoever registered it first so it cannot be used to take the account.
    await db.delete(customerCredentials).where(eq(customerCredentials.customerId, existing.id))
    return existing
  }

  const id = crypto.randomUUID()
  const email = input.email.toLowerCase()
  try {
    await db.insert(customers).values({ id, email, name: input.name ?? null, role: "user" })
  } catch (error) {
    // two first-time sign-ins at once: the other request created the row, so use it
    if (!isDuplicateError(error)) throw error
    const created = await findCustomerByEmail(email)
    if (created) return created
    throw error
  }
  return { id, email, name: input.name ?? null, role: "user" }
}
