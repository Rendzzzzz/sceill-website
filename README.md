# SCEILL

Online store for luxury fragrances. Built with Next.js (App Router), TypeScript, Tailwind CSS 4 and PostgreSQL.

## Documentation

Full documentation is in the [docs/](docs/README.md) folder: overview, setup, architecture, database, API reference, business rules, deployment, security, troubleshooting, and how to use the backend from a mobile app.

## What's inside

| Area | Details |
|---|---|
| Storefront | Home, catalog (search / filter / sort), product pages, cart (saved in the browser), promotions, blog |
| Accounts | Register and sign in with email + password, plus Google and Apple. Registration requires a delivery address (province, city, district, street). `/user/profile` lets customers edit their details, address and password, and "Forgot password?" checks the email and lets the customer choose a new password (no email is sent; see [Security](docs/08-security.md)) |
| Checkout & orders | Checkout with server-side pricing and stock reservation, bank-transfer payment, order history with progress tracking (`/user/orders`), unpaid orders cancel themselves after 24 hours |
| Admin | `/admin` for orders (mark paid / preparing / shipped with tracking / delivered / cancelled), products and promotions (admin accounts only) |
| Database | PostgreSQL through [Drizzle ORM](https://orm.drizzle.team) |
| Not built yet | Online payment gateway (Midtrans / Xendit), order emails, courier rate calculation, email verification, rate limiting |

## Setup

You need Node.js 20+ and a PostgreSQL 14+ server.

### 1. Install and start PostgreSQL

```bash
# Homebrew (macOS)
brew install postgresql@16
brew services start postgresql@16
```

If it refuses to start with a message about a *locale*, start it with one set:
`LC_ALL=en_US.UTF-8 brew services start postgresql@16`.

Or with Docker:

```bash
docker run -d --name sceill-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sceill postgres:16
```

Create the database (not needed for the Docker command above):

```bash
createdb sceill
```

(A hosted PostgreSQL works too; just put its address in `DATABASE_URL`.)

### 2. Configure

```bash
cp .env.example .env.local
```

Edit `.env.local`:

- `DATABASE_URL` - `postgres://USER:PASSWORD@HOST:PORT/DATABASE`. With Homebrew, the user is your Mac username and there is no password: `postgres://your_mac_username@localhost:5432/sceill`
- `NEXTAUTH_SECRET` - any long random string (`openssl rand -base64 32`)
- `BANK_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_HOLDER` - the account customers pay into (shown after they place an order). Until these are set, customers are told the bank details will be sent to them
- `GOOGLE_*` / `APPLE_*` - optional, only for social login

### 3. Create the tables and sample data

```bash
npm install
npm run db:push     # creates the tables from db/schema.ts
npm run db:seed     # sample perfumes, a promo and a blog post (safe to repeat)
npm run dev         # http://localhost:3000
```

### 4. M ake yourself an admin

Register on the site first, then:

```bash
npm run db:make-admin -- you@example.com
```

Sign out and back in; `/admin/products` and `/admin/promos` are now available.

## Deploying (Vercel + Aiven free PostgreSQL)

Vercel hosts the website; the database lives separately on Aiven.

### 1. Database on Aiven

1. Sign up at aiven.io (no credit card), then create a service: **PostgreSQL**, **Free plan**, the region closest to your visitors.
2. When it shows *Running*, open the service overview and copy:
   - the **Service URI** (looks like `postgres://avnadmin:...@...aivencloud.com:PORT/defaultdb?sslmode=require`)
   - the **CA certificate** (download it, or copy the text)
3. Create the tables once, from your computer, pointing at that database. Put the two values in a file named `.env.aiven` (it is git-ignored):

   ```
   DATABASE_URL=postgres://avnadmin:...@...aivencloud.com:PORT/defaultdb?sslmode=require
   DATABASE_CA="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
   ```

   (the certificate goes on one line, with `\n` where the line breaks were), then:

   ```bash
   set -a; source .env.aiven; set +a
   npm run db:push
   npm run db:seed
   ```

The free plan powers off after a period of inactivity (Aiven emails you first). If the site shows empty shelves after a quiet spell, power the service back on in the Aiven console.

### 2. Website on Vercel

1. Push the code to **your own** GitHub repository.
2. At vercel.com choose *Add New > Project*, import that repository.
3. Add these environment variables (Settings > Environment Variables):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Aiven Service URI |
   | `DATABASE_CA` | the CA certificate (paste it as is; Vercel accepts multiple lines) |
   | `NEXTAUTH_SECRET` | a long random string (`openssl rand -base64 32`) |
   | `NEXTAUTH_URL` | your site address, e.g. `https://sceill.vercel.app` |
   | `BANK_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_HOLDER` | where customers send their payment |
   | `GOOGLE_*`, `APPLE_*` | optional, only for social login |

4. Deploy. If `NEXTAUTH_URL` was a guess, correct it to the real address and redeploy.
5. Register on the live site, then make that account an admin from your computer:

   ```bash
   set -a; source .env.aiven; set +a
   npm run db:make-admin -- you@example.com
   ```

For Google / Apple login, add `https://YOUR-SITE/api/auth/callback/google` (and `/apple`) to the allowed redirect URLs in their consoles.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run db:push` | Sync the tables with `db/schema.ts` (run again after editing the schema) |
| `npm run db:seed` | Insert the sample data |
| `npm run db:make-admin -- <email>` | Grant admin rights to an account |
| `npm run db:reset-password -- <email>` | Set a temporary password for any account, including admins |
| `npm run db:studio` | Browse and edit the data in the browser |

## Project layout

```
db/                     schema.ts (tables), connection.ts, seed.ts, make-admin.ts
app/
  page.tsx, catalog/, product/[slug]/, cart/, promo/, blog/    storefront
  (auth)/login, (auth)/register                               account pages
  admin/                                                      admin screens
  api/register, api/auth, api/customers, api/admin/*, api/newsletter, api/regions
  lib/db/               PostgreSQL connection (server only)
  lib/customers.ts, products.ts, content.ts                   data access
  lib/regions/          Indonesian province / city / district data
  components/           UI, sections, product, cart, auth
```

## How ordering works

1. The bag lives in the customer's browser. At checkout the browser sends only *which products and how many*.
2. The server looks up current prices and stock, adds shipping (Rp 25.000, free from Rp 1.500.000), reserves the stock and saves the order together with a copy of the address and item prices.
3. The customer pays by bank transfer within 24 hours. An admin confirms it in `/admin/orders` and moves the order through *paid, preparing, shipped* (with tracking number) and *delivered*.
4. Cancelling an order, or letting it expire unpaid, puts the stock back.

## Notes

- Database code runs on the server only. Pages never talk to PostgreSQL from the browser; they use server components or the API routes.
- Passwords are stored as bcrypt hashes in their own table (`customer_credentials`).
- Emails are matched ignoring letter case (a unique index on `lower(email)` enforces one account per address).
- Region data covers 34 provinces; the Papua provinces created from 2022 are not included yet.
