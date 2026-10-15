# 5. API reference

Every endpoint in `app/api/`. All of them exchange JSON. The website itself uses these; they are not a published public API (see [10. Using it from a mobile app](10-mobile-app.md)).

## Conventions

**Who may call:**

| Label | Meaning |
|---|---|
| Public | Anyone |
| Signed in | A valid login session cookie. The customer is always taken from the session, never from the request |
| Owner or admin | Signed in, and the record is theirs, or they are an admin |
| Admin | Signed in with role `admin` |

**Status codes:**

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | The input is invalid |
| 401 | Not signed in |
| 403 | Signed in but not allowed |
| 404 | Not found |
| 409 | Conflict: a duplicate, an out-of-stock item, or a status move that is not allowed |
| 500 | Unexpected server error (the details are written to the server log, not sent back) |

**Error body:**

```json
{ "error": "A readable message" }
```

Validation errors usually start with the field name: `{ "error": "phone: Enter a valid phone number, e.g. 0812 3456 7890" }`. `/api/register` additionally returns `fieldErrors`: `{ "error": "...", "fieldErrors": { "email": "..." } }`.

**Login:** NextAuth keeps the session in a cookie (`next-auth.session-token`, or `__Secure-next-auth.session-token` on https). Browsers send it automatically.

---

## Accounts and login

### `POST /api/register`  (Public)

Creates an account and its delivery address.

```json
{
  "name": "Ana Putri",
  "email": "ana@example.com",
  "password": "Secret123",
  "provinceId": "31",
  "regencyId": "3171",
  "districtId": "3171010",
  "address": "Jl. Moh Kahfi 1 No 12, RT 02/RW 05"
}
```

| Field | Rule |
|---|---|
| `name` | 2 to 80 characters |
| `email` | A valid address. Stored lower-case |
| `password` | 8 to 72 characters, with at least one letter and one number |
| `provinceId`, `regencyId`, `districtId` | Codes of 2, 4 and 7 digits (from `/api/regions`). The district must belong to the city, and the city to the province |
| `address` | 10 to 255 characters |

Responses: `201 { "id", "email" }`; `400` for invalid input or a mismatched region; `409` if the email already has an account; `500`. The new user is not signed in by this call; the register page signs them in afterwards.

### `/api/auth/*`  (NextAuth)

Handled by NextAuth, not by this project's code. The useful ones: `GET /api/auth/session` (who am I; `{}` when signed out), `GET /api/auth/csrf`, `POST /api/auth/callback/credentials` (email + password sign-in), `GET /api/auth/providers`, and `/api/auth/signin/google`, `/api/auth/signin/apple`, `/api/auth/signout`. Configuration: [app/lib/auth.ts](../app/lib/auth.ts).

The session contains `user.id`, `user.name`, `user.email`, `user.role`.

### `POST /api/password/forgot`  (Public)

Step 1 of changing a forgotten password. **No email is sent.** It says what the email address is, and if the password can be changed, hands back a short-lived token.

```json
{ "email": "ana@example.com" }
```

| Response | Meaning |
|---|---|
| `{ "status": "found", "email": "ana@example.com", "token": "...", "validMinutes": 10 }` | The account has a password. Use the token in the next call |
| `{ "status": "not_found" }` | No account with this email |
| `{ "status": "social" }` | The account signs in with Google or Apple and has no password |
| `{ "status": "admin" }` | An administrator account. Refused: admins reset with `npm run db:reset-password` |
| `400` | Not a valid email address |
| `429` | More than 10 checks for this account within an hour |

This endpoint reveals which emails have accounts, and it does not prove that the caller owns the account (see [8. Security](08-security.md)). The token is 256 random bits, usable once; a new check for the same account cancels the older token. Only its hash is stored.

### `POST /api/password/reset`  (Public)

Step 2: save the new password.

```json
{ "token": "the-token-from-step-1", "password": "NewSecret456" }
```

`password`: 8 to 72 characters with a letter and a number. `200 { "ok": true }` on success: the password is changed and every open token for the account is cancelled. `400` for a weak password (the token stays valid so it can be retried), or `{ "error": "This reset session is invalid or has expired. Please start again." }` for a wrong, expired, already-used or admin-account token. Existing login sessions are not signed out.

### `GET /api/regions`  (Public)

Province, city and district lists for the address dropdowns. Cached for a day.

| Request | Returns |
|---|---|
| `?type=provinces` | All provinces |
| `?type=regencies&parent=31` | Cities and regencies of province `31` |
| `?type=districts&parent=3171` | Districts of city `3171` |

Response: `{ "items": [{ "id": "31", "name": "DKI Jakarta" }] }`. `400` for a bad request, `404` for an unknown parent. The data is bundled in `app/lib/regions/data/` and covers 34 provinces.

---

## Profile

All of these act on the signed-in customer.

### `GET /api/profile`  (Signed in)

Returns the profile: `id, email, name, role, phone, address, provinceCode, cityCode, districtCode, province, city, district, postalCode, createdAt, hasPassword`. Never includes the password hash.

### `PUT /api/profile`  (Signed in)

Saves one section, chosen with `section`.

```json
{ "section": "personal", "name": "Ana Putri", "phone": "0812 3456 7890" }
```

`phone` may be empty. Spaces and dashes are removed; the result is 8 to 15 digits with an optional leading `+`.

```json
{
  "section": "address",
  "provinceId": "32", "regencyId": "3204", "districtId": "3204010",
  "address": "Jl. Braga No 99, Kebon Pisang",
  "postalCode": "40111"
}
```

`postalCode` is optional, 5 digits. Returns the updated profile. `email` and `role` can never be changed here; extra fields are ignored.

### `PUT /api/profile/password`  (Signed in)

```json
{ "currentPassword": "Secret123", "newPassword": "NewSecret456" }
```

`400` if the current password is wrong (`"currentPassword: Your current password is incorrect"`), the new one is weak or the same as the old, or the account has no password (Google/Apple). Returns `{ "ok": true }`.

---

## Shopping and orders

### `POST /api/cart/quote`  (Public)

Current prices, stock and totals for a bag. The checkout page uses it so the screen matches what the server will charge.

```json
{ "items": [{ "productId": "…", "quantity": 2 }] }
```

Each `quantity` is 1 to 10; up to 20 lines. The same product listed twice is merged. Response:

```json
{
  "lines": [{ "productId": "…", "slug": "noir-absolu", "name": "Noir Absolu", "imageUrl": null,
              "unitPrice": 1450000, "quantity": 2, "maxQuantity": 10, "lineTotal": 2900000 }],
  "issues": [{ "productId": "…", "name": "Rose Éternelle", "message": "has only 4 left" }],
  "subtotal": 2900000, "shippingFee": 0, "total": 2900000
}
```

An unknown, hidden or sold-out product appears in `issues`, not `lines`. A quantity above the stock stays in `lines` and also gets an issue.

### `POST /api/orders`  (Signed in)

Places an order.

```json
{
  "items": [{ "productId": "…", "quantity": 2 }],
  "phone": "0812 3456 7890",
  "note": "Please gift wrap",
  "paymentMethod": "bank_transfer"
}
```

`phone` is required. `note` is optional (300 characters at most). Prices and totals are never taken from the request.

| Result | When |
|---|---|
| `201 { "orderNumber": "SCL-…" }` | Placed. Stock is reserved |
| `400` | Invalid input, or the profile has no delivery address |
| `401` | Not signed in |
| `409` | A product is sold out, no longer sold, or has less stock than asked. Nothing is changed |

### `POST /api/orders/{orderNumber}/cancel`  (Owner)

Cancels an order that is still awaiting payment and releases its stock. `404` if it is not the caller's order; `409` once it has been paid.

---

## Newsletter

### `POST /api/newsletter`  (Public)

`{ "email": "fan@example.com" }`. `201 { "ok": true }`, also for an address that is already subscribed. `400` for an invalid email.

---

## Admin

All return `401` when signed out and `403` for a non-admin.

### Orders

`PATCH /api/admin/orders/{id}`

```json
{ "status": "shipped", "trackingNumber": "JNE123456" }
```

`trackingNumber` is used when moving to `shipped`. Allowed moves: `pending_payment` to `paid` or `cancelled`; `paid` to `processing` or `cancelled`; `processing` to `shipped` or `cancelled`; `shipped` to `delivered`. Anything else is `409`. Cancelling puts the items back in stock. Here `{id}` is the order's `id`, not its order number.

### Products

| Request | What it does |
|---|---|
| `GET /api/admin/products` | List: `id, name, price, stock, is_available, category` |
| `POST /api/admin/products` | Create. Body: `name, slug, description, price, category, stock, image_url, is_available`. `409` if the slug is taken |
| `DELETE /api/admin/products/{id}` | Delete. Old orders keep their copy of the item |

`slug`: lower-case letters, numbers and single dashes. `price` and `stock`: whole numbers, 0 or more. `image_url`: empty or an `http(s)://` link.

### Promos

| Request | What it does |
|---|---|
| `GET /api/admin/promos` | List |
| `POST /api/admin/promos` | Create. Body: `title, slug, description, discount_percent (1-100), start_date, end_date (YYYY-MM-DD), image_url, is_active`. The end date may not be before the start date |
| `DELETE /api/admin/promos/{id}` | Delete |

### Customers

| Request | Who | What it does |
|---|---|---|
| `GET /api/customers` | Admin | List all customers (no password data) |
| `GET /api/customers/{id}` | Owner or admin | One customer |
| `PUT /api/customers/{id}` | Owner or admin | Change `name`, `phone`, `address` or `postal_code` only. `role`, `email` and `id` can never be changed |
| `DELETE /api/customers/{id}` | Owner or admin | Delete the account. Its password is removed too; past orders stay, with no account attached |

The profile page uses `/api/profile`, which needs no id. These id-based routes exist for admin use.

---

## Trying an endpoint

Public endpoints work straight from a terminal:

```bash
curl http://localhost:3000/api/regions?type=provinces
curl -X POST http://localhost:3000/api/cart/quote \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"PUT-A-REAL-ID-HERE","quantity":1}]}'
```

Endpoints that need a login need the session cookie. The simplest way to try them is from the website itself with the browser's developer tools (Network tab).
