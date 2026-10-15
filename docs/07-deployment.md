# 7. Deployment

The plan: **Vercel** serves the website, **Aiven** (free PostgreSQL) holds the data. Vercel cannot run a database itself; it only runs your code, so the database must be somewhere that is always reachable over the internet.

```
 customers' browsers  ->  Vercel (Next.js site)  ->  Aiven (PostgreSQL, encrypted connection)
```

## Before you start

- A GitHub account, and a **new repository of your own** for this code. The project was cloned from someone else's repository (`git remote -v` shows where it points). Do not push to or deploy from that one unless it is yours.
- A Vercel account (free), signing in with GitHub is simplest.
- An Aiven account (free, no credit card).
- The project folder has a `.vercel/` directory linking it to the previous owner's Vercel project. Delete it, or run `vercel link` to link your own.

## 1. The database on Aiven

1. At aiven.io create a service: **PostgreSQL**, **Free plan**, the region closest to your customers.
2. Wait until it shows *Running*. In the service overview copy:
   - the **Service URI**, like `postgres://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require`
   - the **CA certificate** (download it, or copy the text)
3. Create a file `.env.aiven` in the project (it is git-ignored) with:

   ```
   DATABASE_URL=postgres://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require
   DATABASE_CA="-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----"
   ```

   The certificate goes on **one line**, with `\n` where the line breaks were.
4. Create the tables and sample data in the online database:

   ```bash
   set -a; source .env.aiven; set +a
   npm run db:push
   npm run db:seed
   ```

### About the encrypted connection

Hosted databases only accept encrypted connections. [db/connection.ts](../db/connection.ts) reads the URL and these settings:

| Setting | Effect |
|---|---|
| `?sslmode=require` in the URL | Turns encryption on |
| `DATABASE_CA` | Also **verifies the server's identity**. Recommended. A wrong certificate is refused |
| `DATABASE_SSL=true` | Encryption without a certificate (the server is not verified). Only if you cannot get the certificate |

### Free plan limits

- It powers off after a period of inactivity (Aiven emails first). If the site then shows empty shelves, switch the service back on in the Aiven console.
- 1 GB disk, 1 CPU, 1 GB RAM. Fine for a small shop; not for heavy traffic.
- Support is documentation only.

## 2. The website on Vercel

1. Push the code to your GitHub repository.
2. At vercel.com choose **Add New, then Project**, and import it. Vercel detects Next.js; leave the build settings alone.
3. Under **Environment Variables** add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | The Aiven Service URI |
   | `DATABASE_CA` | The CA certificate. Paste it as it is, line breaks included; Vercel accepts multi-line values |
   | `NEXTAUTH_SECRET` | A long random string (`openssl rand -base64 32`). Never reuse the local one |
   | `NEXTAUTH_URL` | The site's address, such as `https://sceill.vercel.app` |
   | `BANK_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_HOLDER` | Where customers pay |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` | Optional, only for social login |

4. Click **Deploy**.
5. If `NEXTAUTH_URL` was a guess, set it to the real address and redeploy (Deployments, then Redeploy).
6. Open the site, register an account, then make it an admin from your computer:

   ```bash
   set -a; source .env.aiven; set +a
   npm run db:make-admin -- you@example.com
   ```

   Sign out and in on the live site.

Every push to the main branch deploys automatically after this.

### Things that behave differently online

- **Connection pool:** on Vercel the app opens at most 2 database connections per running instance (10 on your computer), because many instances can run at once and a small database has a connection limit ([app/lib/db/index.ts](../app/lib/db/index.ts)).
- **Build time:** the home, promo and blog pages are prepared during the build and then refreshed every 60 seconds. If the database is off during a build, those pages are built empty and fill in within a minute of the next visit once the database is back.
- **Pages are refreshed, not rebuilt, when data changes.** A new product can take up to 60 seconds to appear on the home page. The catalog is always current.

### Google and Apple login

Add the callback addresses in each provider's console:

```
https://YOUR-SITE/api/auth/callback/google
https://YOUR-SITE/api/auth/callback/apple
```

Keep the local ones (`http://localhost:3000/...`) too if you still develop locally with social login.

## Checklist before real customers

- [ ] `NEXTAUTH_SECRET` is new and secret; `.env*` files are not in git
- [ ] The bank account details are set and correct
- [ ] At least one admin exists, and a test order has been taken through to *delivered*
- [ ] You have decided how you will check the bank for payments, and how often
- [ ] Products have real names, prices, stock and photos (use `https://` links in `image_url`)
- [ ] Terms of Service and Privacy Policy pages exist (the register page mentions them but they are not written)
- [ ] You know how the database is backed up (see below)
- [ ] You have read [8. Security](08-security.md), especially the list of missing protections

## Backups

The Aiven free plan is not a backup strategy. Take your own copy regularly:

```bash
pg_dump "$DATABASE_URL" > backup-$(date +%F).sql
```

(With `DATABASE_URL` from `.env.aiven` loaded; if the connection needs the certificate, save it to a file and add `sslrootcert=/path/to/ca.pem` to the URL for this command.)

## Updating the live site

1. Change the code locally and test it.
2. If you changed `db/schema.ts`, apply the change to the online database **before** the new code goes live: load `.env.aiven`, then `npm run db:push`. (The `password_reset_tokens` table for "forgot password" was added after the first deployment, so the online database needs this step once.)
3. Push to GitHub. Vercel deploys by itself.
