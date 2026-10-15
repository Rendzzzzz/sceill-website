# 10. Using it from a mobile app

This backend was built for the website. A native iOS or Android app can reuse a lot of it, but not all of it as it stands. This page says exactly what works, what is missing, and a sensible way to close the gap.

## What a mobile app could already use

These endpoints need no login and return plain JSON, so an app can call them today:

| Endpoint | Gives you |
|---|---|
| `GET /api/regions?type=provinces` (and `regencies`, `districts`) | The address dropdown data |
| `POST /api/cart/quote` | Current price, stock and shipping for a list of product ids and quantities |
| `POST /api/newsletter` | Newsletter sign-up |
| `POST /api/register` | Create an account (with the delivery address) |

Full details are in [5. API reference](05-api-reference.md).

## What is missing for an app

### 1. There is no public product API

The website reads products straight from the database inside its pages. No endpoint returns the catalog as JSON. An app needs at least:

- `GET /api/products` with the same filters as the catalog page (`category`, `q`, `sort`)
- `GET /api/products/{slug}`
- `GET /api/categories`

The queries already exist in [app/lib/products.ts](../app/lib/products.ts) (`getProducts`, `getProduct`, `getCategories`), so each endpoint is a few lines that call them and return JSON.

### 2. Login is built for cookies, not tokens

Customers sign in through NextAuth, which stores a session in a browser cookie. Every endpoint that needs a signed-in user (`/api/profile`, `/api/orders`, cancelling an order) reads that cookie.

A native app *can* use cookies: sign in by calling the credentials callback (`GET /api/auth/csrf`, then `POST /api/auth/callback/credentials`) with a cookie jar, and keep sending the cookie. `URLSession` and OkHttp can both do this. But it is awkward (you handle a CSRF token and cookie storage yourself), and there is no ready way for Google or Apple sign-in to hand a session to an app.

A cleaner design for an app is **token login**:

1. Add `POST /api/mobile/login` that takes email and password, checks them with the same code the website uses (`findCustomerByEmail`, `getPasswordHash`, `verifyPassword` in [app/lib/customers.ts](../app/lib/customers.ts)), and returns a signed token (a JWT) containing the customer's id and role.
2. The app stores the token in the Keychain or Keystore and sends it as `Authorization: Bearer <token>`.
3. Replace the session check in the endpoints with a small helper that accepts either the cookie or the bearer token. Today every endpoint calls `getServerSession(authOptions)`; that call would go into one shared function.
4. For Google and Apple, the app uses the platform's native sign-in, sends the resulting ID token to the backend, which verifies it and returns the same kind of token.

### 3. Things the app would need to handle itself

| Topic | Notes |
|---|---|
| The bag | The website keeps it in the browser. In an app, keep it in local storage (the same list of product id and quantity) and call `/api/cart/quote` to show real prices |
| Product images | `image_url` is a full link. Use any image loader |
| Money | Prices are whole Rupiah as integers. Format them in the app |
| Order status | Show the six statuses and their labels from [6. Features](06-features.md) |
| Push notifications | Not built. There is no notification system on the backend yet |
| Payment | Bank transfer is manual. An app can show the bank details returned on the order page, but there is no endpoint that returns them as JSON yet (`GET /api/orders` and `GET /api/orders/{orderNumber}` do not exist; the website builds those pages on the server) |

### 4. Orders: read endpoints are missing

An app can place (`POST /api/orders`) and cancel (`POST /api/orders/{orderNumber}/cancel`) orders, but cannot list or read them as JSON. Add:

- `GET /api/orders` using `getCustomerOrders(customerId)`
- `GET /api/orders/{orderNumber}` using `getCustomerOrder(customerId, orderNumber)`, with the bank details from `getBankDetails()` when the order is awaiting payment

Both functions already exist in [app/lib/orders.ts](../app/lib/orders.ts).

## A sensible order of work

1. Public read endpoints for products and categories. (Small, no login, immediately useful: you can build the catalog screens.)
2. Token login, then the helper that accepts cookie or token.
3. Order read endpoints.
4. Social login for the app.
5. Push notifications and a payment gateway.

Steps 1 to 3 are the minimum for an app that can browse, sign in, and order. Ask for them one at a time; each is a small, testable change.

## Why bother reusing this backend

The expensive and risky parts are already done and tested: price and stock calculation on the server, atomic stock reservation, the order life cycle, address validation, password handling. A new client should reuse them rather than copy the logic, so the website and the app can never disagree about a price.
