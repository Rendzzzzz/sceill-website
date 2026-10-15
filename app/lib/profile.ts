// Server-only: a customer's own profile data.
import { eq } from "drizzle-orm"
import { customerCredentials, customers, db } from "./db"

export interface Profile {
  id: string
  email: string
  name: string
  role: string
  phone: string
  address: string
  provinceCode: string
  cityCode: string
  districtCode: string
  province: string
  city: string
  district: string
  postalCode: string
  createdAt: string
  // accounts created through Google / Apple have no password
  hasPassword: boolean
}

export async function getProfile(customerId: string): Promise<Profile | null> {
  const [row] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1)
  if (!row) return null

  const [credential] = await db
    .select({ id: customerCredentials.customerId })
    .from(customerCredentials)
    .where(eq(customerCredentials.customerId, customerId))
    .limit(1)

  return {
    id: row.id,
    email: row.email,
    name: row.name ?? "",
    role: row.role,
    phone: row.phone ?? "",
    address: row.address ?? "",
    provinceCode: row.provinceCode ?? "",
    cityCode: row.cityCode ?? "",
    districtCode: row.districtCode ?? "",
    province: row.province ?? "",
    city: row.city ?? "",
    district: row.district ?? "",
    postalCode: row.postalCode ?? "",
    createdAt: row.createdAt.toISOString(),
    hasPassword: !!credential,
  }
}
