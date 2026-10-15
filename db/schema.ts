// Database schema (PostgreSQL). `npm run db:push` creates / updates the tables from this file.
import { sql } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

const uuid = () => crypto.randomUUID()

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
const timestamps = {
  createdAt: createdAt(),
  // PostgreSQL has no "on update" column option, so Drizzle sets this on every update
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const customers = pgTable(
  "customers",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(uuid),
    email: varchar("email", { length: 254 }).notNull(),
    name: varchar("name", { length: 120 }),
    role: varchar("role", { length: 20 }).notNull().default("user"),
    phone: varchar("phone", { length: 30 }),
    address: text("address"),
    province: varchar("province", { length: 100 }),
    city: varchar("city", { length: 100 }),
    district: varchar("district", { length: 100 }),
    provinceCode: varchar("province_code", { length: 2 }),
    cityCode: varchar("city_code", { length: 4 }),
    districtCode: varchar("district_code", { length: 7 }),
    postalCode: varchar("postal_code", { length: 10 }),
    ...timestamps,
  },
  // PostgreSQL compares text case-sensitively, so uniqueness is enforced on the
  // lower-case email: "Ana@x.com" is rejected when "ana@x.com" exists
  (t) => [uniqueIndex("customers_email_key").on(sql`lower(${t.email})`)]
)

// Password hashes live apart from `customers` so they are never returned by
// accident when a customer row is sent to the browser.
export const customerCredentials = pgTable("customer_credentials", {
  customerId: varchar("customer_id", { length: 36 })
    .primaryKey()
    .references(() => customers.id, { onDelete: "cascade" }),
  passwordHash: varchar("password_hash", { length: 100 }).notNull(),
  ...timestamps,
})

export const products = pgTable(
  "products",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(uuid),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(), // whole Rupiah
    category: varchar("category", { length: 100 }).notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    stock: integer("stock").notNull().default(0),
    isAvailable: boolean("is_available").notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex("products_slug_key").on(t.slug), index("products_category_idx").on(t.category)]
)

export const promos = pgTable(
  "promos",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(uuid),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    description: text("description").notNull(),
    discountPercent: integer("discount_percent").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex("promos_slug_key").on(t.slug)]
)

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(uuid),
    title: varchar("title", { length: 250 }).notNull(),
    slug: varchar("slug", { length: 250 }).notNull(),
    excerpt: text("excerpt"),
    content: text("content"),
    author: varchar("author", { length: 120 }),
    category: varchar("category", { length: 100 }),
    imageUrl: varchar("image_url", { length: 500 }),
    isPublished: boolean("is_published").notNull().default(false),
    views: integer("views").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("blog_posts_slug_key").on(t.slug)]
)

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(uuid),
    email: varchar("email", { length: 254 }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("newsletter_email_key").on(sql`lower(${t.email})`)]
)

// ---- Orders -------------------------------------------------------------

// An order keeps its own copy of the buyer's contact details, address and every
// item's name and price, so it stays correct even if the customer edits their
// profile or a product is changed or deleted later.
export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(uuid),
    orderNumber: varchar("order_number", { length: 24 }).notNull(),
    customerId: varchar("customer_id", { length: 36 }).references(() => customers.id, { onDelete: "set null" }),
    // pending_payment | paid | processing | shipped | delivered | cancelled
    status: varchar("status", { length: 20 }).notNull().default("pending_payment"),
    paymentMethod: varchar("payment_method", { length: 30 }).notNull().default("bank_transfer"),
    subtotal: integer("subtotal").notNull(),
    shippingFee: integer("shipping_fee").notNull().default(0),
    total: integer("total").notNull(),
    note: text("note"),

    customerName: varchar("customer_name", { length: 120 }).notNull(),
    customerEmail: varchar("customer_email", { length: 254 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 30 }).notNull(),
    shipAddress: text("ship_address").notNull(),
    shipProvince: varchar("ship_province", { length: 100 }).notNull(),
    shipCity: varchar("ship_city", { length: 100 }).notNull(),
    shipDistrict: varchar("ship_district", { length: 100 }).notNull(),
    shipPostalCode: varchar("ship_postal_code", { length: 10 }),

    trackingNumber: varchar("tracking_number", { length: 100 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_number_key").on(t.orderNumber),
    index("orders_customer_idx").on(t.customerId),
    index("orders_status_idx").on(t.status),
  ]
)

export const orderItems = pgTable(
  "order_items",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(uuid),
    orderId: varchar("order_id", { length: 36 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 36 }).references(() => products.id, { onDelete: "set null" }),
    productName: varchar("product_name", { length: 200 }).notNull(),
    productSlug: varchar("product_slug", { length: 200 }),
    imageUrl: varchar("image_url", { length: 500 }),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)]
)

// ---- Password reset -------------------------------------------------------

// Only a SHA-256 hash of each reset token is stored, never the token itself, so a copy
// of this table cannot be used to take over an account. A row is "spent" by setting
// used_at, which also lets the table count recent requests for throttling.
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(uuid),
    customerId: varchar("customer_id", { length: 36 })
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("password_reset_token_hash_key").on(t.tokenHash),
    index("password_reset_customer_idx").on(t.customerId),
  ]
)
