# 6. Features and business rules

What each part of the shop does, and the rules behind it. Where a number comes from, the file that defines it is named, so you can change it there.

## Storefront

### Catalog and search

- `/catalog` lists every product. Filters are in the URL: `?category=Floral&q=rose&sort=price-asc`.
- **Category chips** come from the categories that exist in the `products` table.
- **Search** looks in the name, description and category, ignoring letter case. A `%` or `_` typed by a visitor is searched for literally.
- **Sort:** Newest, Price low to high, Price high to low, Name A to Z.
- A product shows **"Sold out"** when `stock` is 0 or it is switched off (`is_available`), and **"Only N left"** when 5 or fewer remain ([ProductCard.tsx](../app/components/product/ProductCard.tsx)).
- A product with no `image_url` shows a drawn perfume bottle instead.

### Product page

`/product/<slug>`: name, price, description, quantity picker, stock message, "You may also love" (other products from the same family first), and structured data so search engines can read the price and availability. A product can also be opened by its id if it has no slug.

### The bag

- Kept in the browser's `localStorage` under the key `sceill-cart`. It survives reloads and closing the tab, and is **per browser, not per account**: two people using one browser share a bag, and a bag does not follow you to another device.
- At most 10 of one product ([shipping.ts](../app/lib/shipping.ts)).
- The bag stores prices only for display. At checkout the server looks them up again.
- The header cart icon opens a slide-out bag; "View bag & checkout" goes to `/cart`.

### Promotions and blog

`/promo` lists active promos and `/blog` lists published posts. Both refresh every 60 seconds. **A promo's discount is only displayed; it is not applied to any price.** Blog posts have no detail page and no admin screen yet.

### Newsletter

The subscribe box at the bottom of the home page stores the email. There is no tool for sending newsletters yet.

## Accounts

### Registering

Name, email, password, and a delivery address (province, city, district, street) are all required. After registering, the person is signed in automatically.

- **Password:** 8 to 72 characters with a letter and a number ([validations/auth.ts](../app/lib/validations/auth.ts)). The 72 limit is a bcrypt limit.
- **Email:** one account per address, ignoring letter case (`Ana@x.com` and `ana@x.com` are the same).
- **Address:** the three dropdowns load one after another (province, then its cities, then its districts). The server checks the combination is real.

### Signing in

- Email and password, or Google, or Apple.
- A wrong password and an unknown email give the same message and take about the same time, so the form does not reveal which emails exist.
- A session lasts 14 days.
- **Google or Apple with an email that already has a password account:** the password is removed, so only the verified provider can open it. Reason: password accounts are not email-verified, so someone could register another person's address first. Email verification would make this unnecessary.

### Forgot password

1. On `/login`, **Forgot password?** opens `/forgot-password`. The customer types their email.
2. The page checks the email and answers right away:
   - **No account:** "No account found", with a link to register.
   - **Google or Apple account:** explains there is no password to change.
   - **Administrator account:** "Cannot be reset here. Please contact the site owner."
   - **Account with a password:** the new-password form appears on the same page.
3. The customer chooses a new password (same rules as registration), is sent to the login page with a "password was changed" message, and signs in with it.
4. The form is valid for **10 minutes** and works once. If it times out while open, the page says so and offers to start again. At most 10 checks per account per hour.

**No email is sent, so nothing confirms the person owns the account.** Anyone who knows a customer's email can set a new password for that customer and sign in as them. This is a deliberate simplification, and it is the biggest security gap in the shop; read [8. Security](08-security.md) before taking real customers. Administrator accounts are excluded for exactly this reason: an admin who forgets their password runs `npm run db:reset-password -- email` on a computer with the database settings, which prints a temporary password.

Rules are in [password-reset.ts](../app/lib/password-reset.ts). The page is [ForgotPasswordForm.tsx](../app/%28auth%29/forgot-password/ForgotPasswordForm.tsx).

### Profile (`/user/profile`)

Three separate forms: personal details (name, optional phone; email is read-only), delivery address (and optional postal code), and password (needs the current one). Accounts from Google or Apple see a note instead of the password form. Saving the name also refreshes the name in the header.

### Roles

Two roles: `user` and `admin`. There is no screen for making an admin. Run `npm run db:make-admin -- email`. The role is read when signing in, so the person must sign out and in again.

## Checkout and orders

### Prices and shipping

| Rule | Value | Defined in |
|---|---|---|
| Shipping fee | Rp 25.000 | [shipping.ts](../app/lib/shipping.ts) |
| Free shipping from a subtotal of | Rp 1.500.000 | shipping.ts |
| Maximum per product | 10 | shipping.ts |
| Different products per order | 20 | [validations/order.ts](../app/lib/validations/order.ts) |
| Payment window | 24 hours | [payment.ts](../app/lib/payment.ts) |

Prices are whole Rupiah. Totals are always calculated by the server.

### Placing an order

Needs: a signed-in customer, a saved delivery address, a phone number, and enough stock. The phone is kept on the order, and saved to the profile if the profile had none.

**Stock is reserved when the order is placed, not when it is paid.** An unpaid order therefore holds its stock for up to 24 hours. Two people can never buy the last bottle: the reservation succeeds for one and the other is told it is sold out.

### Order life

```
 pending_payment ──► paid ──► processing ──► shipped ──► delivered
        │              │           │
        └──────────────┴───────────┴────► cancelled
```

| Status | Shown to the customer as | Who moves it |
|---|---|---|
| `pending_payment` | Awaiting payment | Created by checkout |
| `paid` | Paid | Admin, after checking the bank |
| `processing` | Preparing | Admin |
| `shipped` | Shipped (with tracking number) | Admin |
| `delivered` | Delivered | Admin |
| `cancelled` | Cancelled | The customer (only while awaiting payment), an admin (until shipped), or the system (after 24 hours unpaid) |

`delivered` and `cancelled` are final. A cancelled order returns its items to stock. The allowed moves are in [order-status.ts](../app/lib/order-status.ts).

### Automatic expiry

An order that is still awaiting payment 24 hours after it was placed is cancelled and its stock is released. There is no scheduled job. Instead the check runs whenever someone places an order or opens an order list or detail page. The result is the same, with one visible effect: a stale unpaid order may still show as "Awaiting payment" in the database until the next visit to one of those pages.

### Paying

Manual bank transfer. After ordering, the customer sees the amount, the bank account (from `BANK_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_HOLDER`) and the deadline, and is asked to put the order number in the transfer note. An admin checks the bank account and presses **Mark as paid**. There is no automatic matching and no proof upload.

### Order numbers

`SCL-YYMMDD-XXXXXX`, for example `SCL-261008-XNRKCE`. The date is Jakarta's date; the last six characters are random and avoid `0`, `O`, `1` and `I` so they are easy to read aloud.

### What an order remembers

The buyer's name, email, phone, the full delivery address, and for each item the name, price and picture at that moment. Changing the profile or the product later never alters an old order.

## Admin

| Page | What you can do |
|---|---|
| `/admin/orders` | See all orders, filter by status, open one |
| `/admin/orders/<id>` | Move the order along (with a tracking number when shipping), cancel it, see the customer, address, items and history |
| `/admin/products` | List, add, delete. No edit yet |
| `/admin/promos` | List, add, delete. No edit yet |

`/admin` opens the orders page. Admin pages are protected twice: by `proxy.ts`, and again inside each page and endpoint.

## Dates, money and language

- Money: Indonesian Rupiah, written `Rp 1.450.000` ([formatPrice in utils.ts](../app/lib/utils.ts)).
- Times on order pages are shown in Jakarta time (WIB) whatever the server's time zone ([format.ts](../app/lib/format.ts)).
- All text in the shop is English.

## Brand and design

Colours, fonts and animations are defined once in [app/globals.css](../app/globals.css):

| Name | Use |
|---|---|
| `ink` (near black), `ink-soft` | Text, buttons, dark sections |
| `cream`, `sand` | Page background, card tints |
| `gold`, `gold-dark` | Accents |
| `muted` | Secondary text |

Headings use the serif font Cormorant Garamond; body text uses Inter. Buttons and cards use rounded corners (`rounded-lg`, `rounded-xl`). Use these names in class names (`bg-ink`, `text-gold-dark`) instead of raw colour codes.
