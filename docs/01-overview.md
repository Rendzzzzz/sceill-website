# 1. Overview

## What the project is

A web store for perfume. Visitors can browse, search and filter products, keep a shopping bag, and register an account. Signed-in customers check out, pay by bank transfer, and follow their orders. Admins manage orders, products and promotions.

It is one Next.js application. The same codebase contains the website pages and the backend (the API and the database access), so there is no separate server project to run.

## What is built

| Area | Status |
|---|---|
| Home, catalog (search, filter by scent family, sort), product pages | Done |
| Shopping bag (saved in the browser), bag drawer, cart page | Done |
| Register and sign in (email + password, Google, Apple) | Done. Google and Apple need your own keys |
| Delivery address with province, city and district dropdowns | Done. Required at registration |
| Profile page (details, address, password) | Done |
| Forgot password: check the email, then choose a new password right away | Done. **Does not prove who the person is**, see [Security](08-security.md). Admin accounts are excluded |
| Checkout, orders, order history, cancel an unpaid order | Done |
| Payment by manual bank transfer | Done. An admin confirms payment by hand |
| Admin: orders, products (list, add, delete), promos (list, add, delete) | Done |
| Promotions and blog list pages | Done |
| Newsletter sign-up | Done |
| Online payment gateway (Midtrans, Xendit) | Not built |
| Emails (order updates, verifying a password reset) | Not built. The sender code exists but nothing uses it |
| Courier shipping rates | Not built. Shipping is a flat rule |
| Edit a product or a promo (only add and delete exist) | Not built |
| Blog article pages (`/blog/<slug>`) and blog admin | Not built. The list links to pages that do not exist yet |
| Email verification, rate limiting | Not built |

## Technology

| Part | Choice | Why it is here |
|---|---|---|
| Language | TypeScript | JavaScript with types, so mistakes show up before running |
| Framework | Next.js 16, App Router | Pages, API and server code in one project |
| UI library | React 19 | Builds screens out of components |
| Styling | Tailwind CSS 4 | Styles written as short class names, colours defined in `app/globals.css` |
| Database | PostgreSQL | Stores everything |
| Database access | Drizzle ORM (`drizzle-orm`, `pg`) | Typed queries; the tables are described in `db/schema.ts` |
| Forms | react-hook-form + Zod | Form state, and one set of validation rules |
| Login | NextAuth 4 | Sessions, Google and Apple sign-in |
| Passwords | bcryptjs | Passwords are stored as hashes, never as text |
| Icons, animation | lucide-react, framer-motion | framer-motion is installed but not used yet |

Next.js 16 differs from older versions in ways that matter (for example `params` and `searchParams` are promises, and `middleware.ts` is now called `proxy.ts`). The project's [AGENTS.md](../AGENTS.md) tells assistants to read the guides in `node_modules/next/dist/docs/` before changing Next.js code. Do the same.

## Coming from mobile development

If you know iOS or Android, these are the closest equivalents.

| In this project | Closest mobile idea |
|---|---|
| A **page** (`app/catalog/page.tsx`: the folder is the URL) | A screen: Activity, ViewController, or a Compose / SwiftUI destination |
| A **component** (`ProductCard.tsx`) | A view: a Composable, a SwiftUI `View`, a custom `UIView` |
| `useState` | `@State` (SwiftUI), `remember { mutableStateOf }` (Compose) |
| `useEffect` | `onAppear`, `LaunchedEffect`, `viewDidLoad` |
| **Server component** (default; no `"use client"`) | No real equivalent. The screen is built on the server, with direct database access, and sent as finished HTML |
| **Client component** (`"use client"` at the top) | An ordinary interactive view with state and tap handlers |
| An **API route** (`app/api/orders/route.ts`) | A REST endpoint on your backend |
| `fetch("/api/orders")` | Retrofit, Alamofire, URLSession |
| `localStorage` (the shopping bag) | UserDefaults, SharedPreferences |
| The **session cookie** (login) | A stored auth token that is sent with every request |
| Drizzle `db/schema.ts` | Room entities, Core Data model, GRDB records |
| `npm run db:push` | Running a database migration |
| Zod schemas | Validation on a decoded Codable / data class |
| `.env.local` | `local.properties`, an `.xcconfig` file, secrets in BuildConfig |
| `package.json` | `Podfile` / `Package.swift` / `build.gradle` |
| `npm run dev` | Press Run: starts a local server with hot reload |
| Vercel | Where you deploy the website, similar to a hosting service for the app's backend |

One difference to keep in mind: the browser, not an installed app, is the client. There is no app-store release; deploying means the next page load shows the new version.

For using this backend from a native app, see [10. Using it from a mobile app](10-mobile-app.md).
