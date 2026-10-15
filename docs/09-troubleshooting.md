# 9. Troubleshooting

Problems that came up while building this project, with the fix. Search this page for the message you see.

## Starting the site

### `bad interpreter: Operation not permitted` when running `npm run dev`
### Or: `code signature ... not valid for use in process`, or `Cannot find module '../lightningcss.darwin-arm64.node'`

The tools Next.js and Tailwind use contain small native programs. On some Macs these are blocked or fail to install correctly. Reinstall from scratch:

```bash
rm -rf node_modules .next
npm install
```

If macOS still blocks them, check System Settings, Privacy & Security, for a message about the blocked file, and make sure the project folder is not in a restricted location.

### `Port 3000 is in use`

Another copy is running. Stop it (`Ctrl+C` in its terminal), or find it: `lsof -i :3000`, then `kill <pid>`. Next.js will otherwise pick port 3001, but then `NEXTAUTH_URL` no longer matches and login breaks.

### Red error overlay mentioning a package you no longer use (such as `mysql2`)

A leftover from an earlier version of the code, held by the build cache and your open browser tab:

```bash
# stop the dev server first (Ctrl+C), then
rm -rf .next
npm run dev
```

and hard-refresh the browser tab (Cmd+Shift+R).

### `CLIENT_FETCH_ERROR ... Unexpected end of JSON input` in the browser console

The login library failed on the server. Two known causes:
- `next-auth` is older than 4.24.15, which cannot work with Next.js 16 (it uses a pre-Next-15 way of reading cookies). Check with `npm ls next-auth`.
- `NEXTAUTH_SECRET` or `NEXTAUTH_URL` is missing. Look at the terminal running `npm run dev`.

## Packages

### `npm install` ends with "9 vulnerabilities" and suggests `npm audit fix --force`

**Do not run it.** `--force` accepts breaking changes. For this project it:

- changes `next-auth` and `@auth/core` to a mismatched pair, which breaks login (`CLIENT_FETCH_ERROR`)
- downgrades `eslint-config-next` to version 14, which conflicts with Next.js 16 and ESLint 9
- downgrades `drizzle-kit` to 0.18, which cannot read the current schema

The vulnerabilities it reports are in development tools (the linter and the database tool), not in code that runs on the live site. Leave them until you choose to upgrade deliberately.

If you already ran it, put the files back and reinstall:

```bash
git checkout package.json package-lock.json     # only if the working versions are committed
rm -rf node_modules .next
npm install
```

If the working versions are not committed, copy `package.json` and `package-lock.json` from a computer where the project works, then run the last two commands.

The versions that work together: `next ^16.3.8`, `next-auth ^4.24.15`, `@auth/core ^0.34.3`, `eslint-config-next ^16.3.8`, `drizzle-kit ^0.31.11`.

## The database

### The site shows empty shelves, or the home page has no products

The database is not reachable, or not seeded. The terminal running `npm run dev` prints the cause (look for `getProducts failed`).

```bash
pg_isready -h localhost -p 5432        # is PostgreSQL running?
psql -h localhost -d sceill -c "select count(*) from products"
npm run db:push && npm run db:seed     # create tables and sample data
```

### PostgreSQL will not start: `postmaster became multithreaded during startup` / `Set the LC_ALL environment variable`

A macOS locale quirk. Start it with a locale set:

```bash
LC_ALL=en_US.UTF-8 brew services start postgresql@16
# or, without brew services:
LC_ALL=en_US.UTF-8 pg_ctl -D /opt/homebrew/var/postgresql@16 -l /tmp/postgres.log start
```

### `connect ECONNREFUSED 127.0.0.1:5432`

PostgreSQL is not running. See above. It also stops when you restart your Mac unless you started it with `brew services start`.

### `database "sceill" does not exist`

Run `createdb sceill`. (The related log line `database "your.username" does not exist` that appears when starting PostgreSQL is harmless.)

### `npm run db:push` stops at "Pulling schema from database" with nothing after it

drizzle-kit stops silently when it cannot reach the database. `db:push` and `db:studio` first run `db/check-connection.ts`, which prints the real reason in plain words, for example:

- `The database user "xyz" does not exist` : `DATABASE_URL` names a user that does not exist on this computer. With Homebrew PostgreSQL the user is your Mac username (`whoami`). This is the usual problem after copying `.env.local` from another computer, where the username differs.
- `PostgreSQL is not running` : start it (see below).
- `The database "sceill" does not exist yet` : run `createdb sceill`.

If your copy of the project does not print these messages (it was made before the check existed), find the reason by hand:

```bash
whoami                                   # your user name
grep DATABASE_URL .env.local             # does it use that user name?
pg_isready -h localhost -p 5432          # is PostgreSQL running?
psql -h localhost -d postgres -c "\l"     # does the sceill database exist?
```

### `password authentication failed for user ...`

The user or password in `DATABASE_URL` is wrong. Special characters in a password must be URL-encoded (`@` becomes `%40`, `/` becomes `%2F`, `?` becomes `%3F`).

### `self-signed certificate in certificate chain`

You are connecting to a hosted database with `DATABASE_CA` set to the wrong certificate, or you are missing it while something requires verification. Download the CA certificate again from the provider and re-paste it.

### `getaddrinfo ENOTFOUND <host>`

The database address does not exist. For Aiven: the service may be powered off, deleted, or the URL copied wrongly. Open the Aiven console and check the service is *Running*.

### `no pg_hba.conf entry ... no encryption`

The server requires an encrypted connection. Add `?sslmode=require` to `DATABASE_URL`.

## Accounts and login

### Registering says "We could not create your account right now"

The details are hidden from the visitor on purpose. Read the terminal running the site: the line `register failed` is followed by the real cause (usually the database is unreachable or a table is missing).

### I became an admin but `/admin` sends me to the home page

The role is read at sign-in. Sign out, then sign in again. Check it really changed: `psql -h localhost -d sceill -c "select email, role from customers"`.

### Google or Apple sign-in fails

You need your own credentials in `.env.local`, and the callback address added in the provider's console: `http://localhost:3000/api/auth/callback/google` locally, `https://YOUR-SITE/api/auth/callback/google` online. These two logins have not been tested in this project.

### I changed my name but the header still shows the old one

It refreshes right after saving on the profile page. If you changed it by other means, sign out and in.

### "Forgot password" says "No account found" but I registered

The address is typed differently from the one used to register (letter case does not matter, but spelling does). Try the other email you use. Check the database: `psql -h localhost -d sceill -c "select email from customers"`. If you signed up with Google or Apple, the account exists but the page says there is no password to change.

### "Cannot be reset here" on the forgot password page

That email belongs to an administrator, and the website refuses to reset admin passwords on purpose (see [8. Security](08-security.md)). From a computer that has the database settings:

```bash
npm run db:reset-password -- admin@example.com        # local database
set -a; source .env.aiven; set +a; npm run db:reset-password -- admin@example.com   # the online database
```

It prints a temporary password once. Sign in with it and change it on the profile page.

### "Too many attempts for this account. Please try again in an hour."

More than 10 password checks for one account within an hour. Wait an hour, or reset the counter: `psql -h localhost -d sceill -c "delete from password_reset_tokens"`.

### "This session has expired" while choosing a new password

The form is valid for 10 minutes and works once. Press **Start again**.

## Shop and orders

### "Add your delivery address in your profile before checking out."

The account has no address (typical for Google or Apple sign-ups). Add one at `/user/profile`.

### "<product> has only N left" or "is sold out" at checkout

Stock changed since the item was added to the bag. Press **Update my bag** on the checkout page.

### An order is stuck on "Awaiting payment" past 24 hours

It is cancelled the next time anyone places an order or opens an order list or detail page. This is by design (see [6. Features](06-features.md)).

### Customers see "Our team will send you the bank details shortly" instead of an account number

`BANK_NAME`, `BANK_ACCOUNT_NUMBER` and `BANK_ACCOUNT_HOLDER` are not all set. Set all three (locally in `.env.local`, online in Vercel) and restart.

### Stock numbers look wrong

Stock is reserved when an order is placed and returned when it is cancelled or expires. To correct a number by hand: `psql -h localhost -d sceill -c "update products set stock = 12 where slug = 'noir-absolu'"`.

## Code quality tools

### `npm run lint` fails

It currently reports 4 errors in older files: the two admin list pages (a function used before it is declared), `Header.tsx` (a state update inside an effect) and `Input.tsx` (an empty interface). They do not stop the site from working. The files added later are clean. Fix them, or run lint on a single file: `npx eslint app/checkout`.

### `npx tsc --noEmit` shows errors mentioning `.next/dev/types`

The dev server was rewriting those generated files while the check ran. Run it again after the server has settled.

### `AGENTS.md` keeps showing as changed in git

`npm run dev` rewrites that file each time it starts. Commit it once, or ignore the change.

## Still stuck

Read the terminal that is running `npm run dev`: server errors appear there, not in the browser. For database questions, `psql -h localhost -d sceill` lets you look at the data directly.
