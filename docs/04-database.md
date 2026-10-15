# 4. Database

PostgreSQL, accessed through Drizzle ORM. The single source of truth for the tables is **[db/schema.ts](../db/schema.ts)**. Change the tables by editing that file and running `npm run db:push`.

## Overview

```
 customers 1 ---- 1 customer_credentials      (password hash, kept apart on purpose)
     |
     | 1
     |
     N  (customer_id, may become empty if the account is deleted)
   orders 1 ---- N order_items N ---- 1 products   (product_id, may become empty if deleted)

 customers 1 ---- N password_reset_tokens     (short-lived tokens for "forgot password")

 promos, blog_posts, newsletter_subscribers      stand alone
```

Nine tables. All ids are text (UUIDs) created by the application, not by the database.

## customers

One row per person who has an account, whichever way they signed up.

| Column | Type | Notes |
|---|---|---|
| `id` | text(36), primary key | UUID |
| `email` | text(254) | Always stored lower-case. Unique, ignoring letter case |
| `name` | text(120) | |
| `role` | text(20) | `user` (default) or `admin` |
| `phone` | text(30) | Optional. Digits with an optional leading `+` |
| `address` | text | Street address |
| `province`, `city`, `district` | text(100) | Official names, filled from the server's own region data |
| `province_code`, `city_code`, `district_code` | text(2), (4), (7) | Official region codes. Used to pre-fill the dropdowns and later for courier rates |
| `postal_code` | text(10) | Optional, 5 digits |
| `created_at`, `updated_at` | timestamp with time zone | `updated_at` changes on every update |

Accounts created with Google or Apple have a row here but no row in `customer_credentials`, and no address until they add one on the profile page.

## customer_credentials

| Column | Type | Notes |
|---|---|---|
| `customer_id` | text(36), primary key | Points to `customers.id`. Deleted automatically with the customer |
| `password_hash` | text(100) | bcrypt hash (cost 12), never the password |
| `created_at`, `updated_at` | timestamp | |

It is a separate table so a password hash can never be sent to the browser by accident when a customer row is returned.

## products

| Column | Type | Notes |
|---|---|---|
| `id` | text(36), primary key | |
| `name` | text(200) | |
| `slug` | text(200), unique | The URL part: `/product/<slug>`. Lower-case letters, numbers, dashes |
| `description` | text | |
| `price` | integer | Whole Rupiah. `1450000` means Rp 1.450.000 |
| `category` | text(100) | The scent family: Floral, Woody, Oriental, Fresh. Indexed |
| `image_url` | text(500) | Optional. A full `https://` link. With none, a drawn bottle is shown |
| `stock` | integer | Units on hand. Orders reduce it |
| `is_available` | boolean | An admin switch to hide a product from sale |
| `created_at`, `updated_at` | timestamp | |

## promos

| Column | Type | Notes |
|---|---|---|
| `id`, `title`, `slug` (unique), `description` | | |
| `discount_percent` | integer | 1 to 100. Shown on the promo page. **Not applied to prices yet** |
| `start_date`, `end_date` | date | Plain dates (`2026-10-31`) |
| `image_url` | text(500) | Optional |
| `is_active` | boolean | Only active promos appear on `/promo` |

## blog_posts

`id`, `title`, `slug` (unique), `excerpt`, `content`, `author`, `category`, `image_url`, `is_published`, `views`, timestamps. Only published posts appear on `/blog`. There is no admin screen for posts yet; add them through `npm run db:studio` or SQL.

## newsletter_subscribers

`id`, `email` (unique, ignoring letter case), `created_at`. Duplicate sign-ups are accepted quietly.

## password_reset_tokens

One row per password-reset session started from the forgot-password form.

| Column | Type | Notes |
|---|---|---|
| `id` | text(36), primary key | |
| `customer_id` | text(36) | Points to `customers.id`. Deleted with the customer |
| `token_hash` | text(64), unique | SHA-256 of the token. **The token itself is never stored**, so a copy of this table cannot be used to take over an account |
| `expires_at` | timestamp | 10 minutes after the email was checked |
| `used_at` | timestamp, nullable | Set when the link is used, or when a newer link replaces it |
| `created_at` | timestamp | Also used to allow at most 10 checks per account per hour. Rows older than a week are deleted automatically |

## orders

One row per order. It keeps its **own copy** of the buyer's details and address, so the order stays correct if the customer later edits their profile or deletes their account.

| Column | Type | Notes |
|---|---|---|
| `id` | text(36), primary key | |
| `order_number` | text(24), unique | Like `SCL-261008-XNRKCE`: `SCL`, the date (YYMMDD, Jakarta time), then 6 random characters without `0 O 1 I` |
| `customer_id` | text(36), nullable | Becomes empty if the account is deleted. The order stays |
| `status` | text(20) | See below |
| `payment_method` | text(30) | `bank_transfer` |
| `subtotal`, `shipping_fee`, `total` | integer | Whole Rupiah, calculated by the server |
| `note` | text | The customer's gift or delivery note |
| `customer_name`, `customer_email`, `customer_phone` | | Copied from the profile (phone from the checkout form) |
| `ship_address`, `ship_province`, `ship_city`, `ship_district`, `ship_postal_code` | | Copied delivery address |
| `tracking_number` | text(100) | Set when shipped |
| `expires_at` | timestamp | Payment deadline: 24 hours after the order is placed |
| `paid_at`, `shipped_at`, `delivered_at`, `cancelled_at` | timestamp | Filled as the order moves along |
| `created_at`, `updated_at` | timestamp | |

Statuses: `pending_payment` (awaiting payment), `paid`, `processing` (shown as "Preparing"), `shipped`, `delivered`, `cancelled`. The allowed moves are in [6. Features and business rules](06-features.md).

## order_items

| Column | Type | Notes |
|---|---|---|
| `id` | text(36), primary key | |
| `order_id` | text(36) | Points to `orders.id`. Deleted with the order |
| `product_id` | text(36), nullable | Points to `products.id`. Becomes empty if the product is deleted |
| `product_name`, `product_slug`, `image_url` | | Copied when the order was placed |
| `unit_price` | integer | The price at the time of the order |
| `quantity` | integer | |

Because the name and price are copied, deleting or repricing a product never changes an old order.

## Indexes that matter

| Index | Why |
|---|---|
| `customers_email_key` on `lower(email)` | One account per email, ignoring letter case |
| `newsletter_email_key` on `lower(email)` | Same for the newsletter |
| `products_slug_key`, `promos_slug_key`, `blog_posts_slug_key` | Unique URLs |
| `orders_number_key` | Unique order numbers |
| `orders_customer_idx`, `orders_status_idx`, `order_items_order_idx`, `products_category_idx` | Speed for "my orders", the admin status filter, an order's items, and the catalog filter |

## Changing the database

1. Edit `db/schema.ts`.
2. Run `npm run db:push`. It compares the file with the real database and applies the difference. It can ask before dropping a column.
3. Update the code that reads or writes the changed table.

`db:push` suits this early stage. Before the shop holds real customers, consider switching to Drizzle's migration files (`drizzle-kit generate` and `migrate`), which keep a history of every change.

## Looking at the data

```bash
psql -h localhost -d sceill -c "select order_number, status, total from orders order by created_at desc limit 10"
npm run db:studio        # a table browser in the web browser
```

Never edit order rows by hand while customers are shopping. Use the admin pages, which also keep stock correct.
