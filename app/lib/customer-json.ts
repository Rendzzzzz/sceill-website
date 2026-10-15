import type { customers } from "./db"

// The shape sent to browsers. It is built field by field so a new database
// column is never exposed by accident.
export function toCustomerJson(c: typeof customers.$inferSelect) {
  return {
    id: c.id,
    email: c.email,
    name: c.name,
    role: c.role,
    phone: c.phone,
    address: c.address,
    province: c.province,
    city: c.city,
    district: c.district,
    postal_code: c.postalCode,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  }
}
