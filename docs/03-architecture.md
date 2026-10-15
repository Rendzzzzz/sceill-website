# 3. Architecture

## Folder map

```
sceill-website/
├── app/                      the website and the backend
│   ├── page.tsx              home page          (URL: /)
│   ├── layout.tsx            wraps every page (header, footer, fonts, cart)
│   ├── globals.css           colours, fonts, animations (Tailwind theme)
│   ├── providers.tsx         login session + shopping bag, available everywhere
│   ├── catalog/              /catalog
│   ├── product/[slug]/       /product/noir-absolu   (one page for every product)
│   ├── cart/                 /cart
│   ├── checkout/             /checkout
│   ├── promo/, blog/         /promo, /blog
│   ├── (auth)/login, register    /login, /register  (the (auth) folder is only for grouping)
│   ├── user/profile/         /user/profile
│   ├── user/orders/          /user/orders and /user/orders/<number>
│   ├── admin/                /admin/orders, /admin/products, /admin/promos
│   ├── api/                  the backend: every folder with a route.ts is an endpoint
│   ├── components/           reusable pieces of UI
│   │   ├── ui/               Button, Card, Input
│   │   ├── layout/           Header, Footer
│   │   ├── sections/         home page sections
│   │   ├── product/          ProductCard, AddToCartButton, ProductImage, BottleArt
│   │   ├── cart/             CartDrawer
│   │   ├── auth/             AuthShell, SocialButtons, RegionFields
│   │   └── orders/           StatusBadge, OrderLines
│   ├── lib/                  logic, no screens
│   │   ├── db/               the database connection (server only)
│   │   ├── regions/          province / city / district data
│   │   ├── validations/      Zod rules: auth.ts, profile.ts, order.ts
│   │   ├── auth.ts           login configuration
│   │   ├── orders.ts         creating and managing orders
│   │   ├── customers.ts, profile.ts, products.ts, content.ts   data access
│   │   ├── admin.ts          "is this an admin?" check for API routes
│   │   ├── cart.tsx          the shopping bag (browser side)
│   │   ├── shipping.ts, payment.ts, order-status.ts   shop rules
│   │   └── format.ts, utils.ts   small helpers
│   └── types/                shared TypeScript types
├── db/
│   ├── schema.ts             every table, in code
│   ├── connection.ts         builds the database connection settings
│   ├── seed.ts               sample data
│   └── make-admin.ts         makes an account an admin
├── proxy.ts                  login guard for /admin, /user, /checkout
├── drizzle.config.ts         settings for the database tool
├── next.config.js            Next.js settings
├── docs/                     this documentation
├── .env.example              template for .env.local
└── AGENTS.md, CLAUDE.md      instructions for AI coding assistants
```

### How a URL becomes a page

The folders under `app/` are the website's addresses. A folder with a `page.tsx` is a page; a folder with a `route.ts` is an API endpoint.

| File | URL |
|---|---|
| `app/page.tsx` | `/` |
| `app/catalog/page.tsx` | `/catalog` |
| `app/product/[slug]/page.tsx` | `/product/anything` (the part in brackets is a variable) |
| `app/(auth)/login/page.tsx` | `/login` |
| `app/api/orders/route.ts` | `POST /api/orders` |

## Two kinds of components

**Server components** are the default. They run on the server, can read the database directly, and send finished HTML to the browser. Most pages are server components: the catalog, product page, order pages and admin lists.

**Client components** start with `"use client"`. They run in the browser and can hold state and react to clicks: the bag, forms, dropdowns, the checkout screen.

The rule used throughout: **only server code talks to the database.** Client components never import from `app/lib/db`, `db/`, or anything that does. They call an API route with `fetch` instead. That keeps database passwords out of the browser.

## How the pieces connect

```
   proxy.ts            runs first on /admin, /user, /checkout:
                       not signed in -> /login ; not admin -> /

   page.tsx            (server) asks lib/*.ts for data
        |
        v
   lib/products.ts, orders.ts, ...     the only code that builds queries
        |
        v
   lib/db  ->  Drizzle  ->  pg  ->  PostgreSQL

   Client component    fetch("/api/...") -> route.ts -> lib/*.ts -> database
```

## Request flows

### Browsing the catalog

```
GET /catalog?category=Floral&sort=price-asc
  -> app/catalog/page.tsx (server)
       reads the URL parameters
       getProducts({category, sort}) and getCategories()  ->  database
  -> HTML with the product cards sent to the browser
```

Filters live in the URL, so a filtered list can be bookmarked or shared.

### Registering

```
Register form (browser)
  -> checks the fields with Zod (same rules as the server)
  -> POST /api/register
       validates again, checks the district really belongs to the city and province,
       hashes the password with bcrypt,
       saves the customer and the password in ONE transaction
  -> then signIn("credentials") logs the new user straight in
```

### Signing in

```
POST /api/auth/callback/credentials   (handled by NextAuth)
  -> lib/auth.ts "authorize": finds the customer by email (ignoring letter case),
     compares the password with its hash
  -> on success NextAuth stores a signed session in a cookie (valid 14 days)
     containing the customer's id, name, email and role
```

The role in the cookie is fixed when you sign in. If an admin is made or removed, that person must sign out and in again.

### Forgetting a password

```
/forgot-password   step 1:  POST /api/password/forgot {email}
   - unknown email          -> "no account"
   - Google/Apple account   -> "no password to change"
   - admin account          -> refused ("contact the site owner")
   - otherwise              -> a random 256-bit token (only its hash is stored, valid 10 minutes, one use)
                               is returned to the page, which shows the new-password form straight away

                   step 2:  POST /api/password/reset {token, password}
   - checks and spends the token, saves the new bcrypt hash, cancels any other open token
   - then the page goes to /login?reset=1
```

No email is involved, so nothing proves the person owns the account. That is the main weakness of this flow, and why admins are excluded. See [8. Security](08-security.md).

### Checking out

```
Bag (browser, localStorage)           only product ids and quantities are trusted
  -> /checkout asks POST /api/cart/quote   for current prices, stock and shipping
  -> "Place order" -> POST /api/orders
       1. cancel any unpaid orders past their deadline (releases their stock)
       2. check the customer has a delivery address
       3. in one database transaction:
            lock the product rows
            re-read prices and stock
            reduce stock (only if enough is left)
            save the order and its items, with a copy of the address and prices
  -> redirect to /user/orders/<order number> which shows the bank details
```

The browser never sends prices or totals that the server believes.

### Managing an order (admin)

```
/admin/orders/<id>  ->  button  ->  PATCH /api/admin/orders/<id> {status}
  -> checks the admin role, checks the move is allowed (paid -> preparing -> shipped -> delivered),
     records the time, and puts stock back if the order is cancelled
```

## Data fetching and caching

| Page | How it is built |
|---|---|
| Home, promotions, blog | Built once and refreshed at most every 60 seconds (`export const revalidate = 60`). A product change can take up to a minute to show on the home page |
| Catalog, product, cart, checkout, profile, orders, admin | Built on every request, because they depend on the URL or the signed-in user |

## Login protection, in two layers

1. **`proxy.ts`** redirects before the page is even built: signed-out visitors to `/login`, and non-admins away from `/admin`. In Next.js 16 this file replaces what used to be called `middleware.ts`.
2. **The page or API route itself** checks again (`getServerSession`, `requireAdmin`). This second check is the one that actually protects the data, so every admin page and endpoint repeats it.

## Housekeeping notes

Things in the repository that are leftovers or worth knowing:

- Both `next.config.js` and `next.config.ts` exist. Next.js uses the `.js` one (the dev server log says "Running next.config.js"); the `.ts` file is ignored. Edit the `.js` one, and consider deleting the other.
- `framer-motion`, `@radix-ui/react-slot` and `class-variance-authority` are installed but not imported anywhere. They can be removed with `npm uninstall`.
- `AGENTS.md` is rewritten by `npm run dev` each time it starts, which is why it shows up as a changed file in git.
- The admin product and promo lists have an "Edit" link to a page that does not exist.
- The blog list links to `/blog/<slug>` pages that do not exist.
- `app/lib/mail.ts`, `app/lib/email-templates.ts`, `app/lib/site-url.ts` and the `nodemailer` package are not used by any page now. They are kept so emails can be added back later (for example to verify the owner during a password reset); delete them if you never will.
- The header menu has "My Orders" and "Manage Orders" (both built) and "Manage Blog" (not built).
