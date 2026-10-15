# 2. Getting started

How to run the project on your own computer. About 10 minutes the first time.

## What you need

- **Node.js 20 or newer** (`node -v` to check)
- **PostgreSQL 14 or newer**, running on your computer, or a hosted one
- A code editor. VS Code works well with the project.

## First-time setup

### 1. Install the packages

```bash
npm install
```

This reads `package.json` and downloads everything into `node_modules/` (like `pod install` or a Gradle sync).

### 2. Start PostgreSQL

Homebrew on macOS:

```bash
brew install postgresql@16
brew services start postgresql@16
```

If it fails to start with a message about a *locale*, start it with one set:

```bash
LC_ALL=en_US.UTF-8 brew services start postgresql@16
```

Check it is running:

```bash
pg_isready -h localhost -p 5432      # should say "accepting connections"
```

Docker works too:

```bash
docker run -d --name sceill-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sceill postgres:16
```

### 3. Create an empty database

```bash
createdb sceill
```

(Skip this with the Docker command above, which already creates it.)

### 4. Set the environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill it in. `.env.local` holds secrets and is ignored by git, so it never gets committed.

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | Yes | Where the database is. Local Homebrew: `postgres://YOUR_MAC_USERNAME@localhost:5432/sceill` (no password). Docker: `postgres://postgres:postgres@localhost:5432/sceill` |
| `NEXTAUTH_SECRET` | Yes | A long random string used to sign login sessions. Make one with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | The site's address. `http://localhost:3000` while developing |
| `BANK_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_HOLDER` | For real orders | The bank account customers pay into, shown after they place an order. If unset, customers are told the details will be sent to them |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Only for Google login | From Google Cloud Console |
| `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` | Only for Apple login | From the Apple developer portal |
| `DATABASE_CA`, `DATABASE_SSL` | Only for hosted databases | Encryption settings, see [Deployment](07-deployment.md) |

Email and password login works without the Google and Apple keys. Those two buttons simply will not work until you add them.

### 5. Create the tables and add sample data

```bash
npm run db:push     # creates the tables from db/schema.ts
npm run db:seed     # 6 sample perfumes, 1 promo, 1 blog post (safe to run again)
```

### 6. Start the site

```bash
npm run dev
```

Open <http://localhost:3000>. The page refreshes by itself when you save a file.

### 7. Make yourself an admin

1. Open <http://localhost:3000/register> and create an account.
2. Run:

   ```bash
   npm run db:make-admin -- you@example.com
   ```

3. Sign out and sign in again (the admin role is read when you sign in).
4. Open <http://localhost:3000/admin>.

## Daily workflow

| Task | Command |
|---|---|
| Start the site | `npm run dev` |
| Check the types | `npx tsc --noEmit` |
| Check code style | `npm run lint` |
| See and edit the database in a browser | `npm run db:studio` |
| Look at the database from the terminal | `psql -h localhost -d sceill` |
| Apply a schema change | edit `db/schema.ts`, then `npm run db:push` |
| Production build (to check it compiles) | `npm run build` |

## All commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Runs the production build |
| `npm run lint` | ESLint. At the time of writing it reports 4 errors in older files (the admin pages, `Header.tsx`, `Input.tsx`), so a non-zero exit is normal until those are fixed |
| `npm run db:push` | Checks the database connection (and explains any problem), then makes the database match `db/schema.ts` |
| `npm run db:seed` | Inserts the sample data |
| `npm run db:studio` | Opens Drizzle Studio, a table browser |
| `npm run db:make-admin -- <email>` | Gives an existing account admin rights |
| `npm run db:reset-password -- <email>` | Sets a temporary password for any account (prints it once). The only way to reset an admin's password |

## Where the database scripts get their settings

`db:push`, `db:seed`, `db:make-admin` and `db:studio` all read `.env.local`, the same file the website uses. To run one against a different database (for example the online one) set the variables for that single command:

```bash
set -a; source .env.aiven; set +a     # loads DATABASE_URL and DATABASE_CA from a file
npm run db:push
```

## If something does not work

See [9. Troubleshooting](09-troubleshooting.md). The most common first-day problems are PostgreSQL not running, a wrong `DATABASE_URL`, and a missing `NEXTAUTH_SECRET`.
