# 8. Security

An honest list of what is protected, how, and what is not. Read this before you open the shop to real customers.

## What is protected

| Concern | How |
|---|---|
| Passwords | Stored only as bcrypt hashes (cost 12), in a separate table so they are never sent to a browser with a customer record |
| Login errors | A wrong password and an unknown email look and take the same, so the form cannot be used to find out who has an account |
| Sessions | Signed (`NEXTAUTH_SECRET`), kept in an HTTP-only cookie the page's JavaScript cannot read, valid for 14 days |
| Admin pages and APIs | Checked in `proxy.ts` **and again** inside each page and endpoint (`requireAdmin`) |
| Other people's data | Profile and order endpoints take the customer from the session, never from the request, so a customer cannot name someone else's id. `/api/customers/{id}` allows only the owner or an admin |
| Privilege escalation | `role`, `email` and `id` cannot be changed through any customer-facing endpoint. Extra fields in a request are ignored |
| Prices and totals | Always calculated on the server from the database. A tampered bag cannot change what is charged |
| Overselling | Stock is reserved inside a database transaction with row locks; tested with 6 simultaneous buyers of the last item |
| SQL injection | All queries go through Drizzle with bound parameters. Search text has `%` and `_` escaped |
| Cross-site scripting | React escapes text it shows (names, notes, addresses). The only raw HTML is product structured data, where `<` is escaped |
| Open redirects | After login, only on-site paths are accepted as the return address (`safeCallbackUrl`) |
| Region data | The server checks that the province, city and district belong together and writes the names itself |
| Database connection | Encrypted, with the server's certificate verified when `DATABASE_CA` is set |
| Secrets | `.env*` files are git-ignored. The database and bank settings are read only on the server |
| Password reset tokens | 256 random bits, valid 10 minutes, usable once, only the hash is stored; at most 10 checks per account per hour. Admin accounts cannot be reset from the website (see below) |

## Read this first: anyone can reset anyone's password

"Forgot password" asks only for an email address. It does not email a link or code, so it never checks that the person typing is the owner. **Anyone who knows (or guesses) a customer's email can set a new password for that account, sign in as them, and see their name, phone, address and orders.** The same form also tells anyone whether an email has an account.

What limits the damage today:
- Administrator accounts are refused by the form and by the server, even for a token issued before the account became an admin. Admins reset with `npm run db:reset-password -- email`.
- At most 10 checks per account per hour (this slows nothing down for an attacker, who needs one).

What fixes it properly, in order of effort:
1. **Prove ownership by email.** Send the token as a link to the account's own email, so only the real owner can use it. The sender code (`app/lib/mail.ts`, `app/lib/email-templates.ts`) is still in the project for this: step 1 would email the link instead of returning the token.
2. **Ask for something only the owner knows**, such as the phone number saved on the account, before showing the form. Weaker (acquaintances may know it) and phone is optional at registration.
3. **Send a code to the phone** by SMS or WhatsApp. Needs a paid messaging service.

Do option 1 before the shop has real customers.

## What is NOT protected yet

Ordered by how much it matters for a real shop.

1. **No rate limiting.** Someone can try passwords, create accounts or place orders as fast as they like. Add limits on `/api/auth/callback/credentials`, `/api/register` and `/api/orders` before launch (a service such as Upstash works well on Vercel).
2. **No email verification.** Anyone can register using another person's email. The code limits the damage (see Google/Apple linking in [6. Features](06-features.md)), but verification is the real fix, and it is needed before you email customers.
3. **Payment confirmation is manual.** There is no proof of transfer and no automatic bank matching, so an admin must check the bank statement carefully. A payment gateway removes this risk.
4. **Sessions cannot be cancelled.** Sessions are self-contained cookies valid for 14 days. Changing a password, deleting an account or removing someone's admin role does not sign out their existing sessions; the role in particular stays until the cookie expires. If you need instant revocation, move to database sessions.
5. **Admin actions are not logged.** There is no record of who marked an order paid or deleted a product.
6. **Deleting a product or promo has no undo and no confirmation on the server.** (The page asks "are you sure?", the endpoint does not.)
7. **No security headers are configured** by the project (such as a Content Security Policy). Add them in `next.config.js` before launch.
8. **Known dependency warnings.** `npm audit` reports issues in `next-auth` (its `cookie` and `uuid` packages) and in the ESLint toolchain (`glob`). Do not run `npm audit fix --force`: it forces major upgrades that can break the login. Instead, upgrade deliberately and test, and check the audit again from time to time.
9. **Google and Apple login are untested** in this project. Test them with real credentials before relying on them.
10. **Resetting a password does not sign out existing sessions.** Someone already logged in stays logged in until their cookie expires (up to 14 days). See point 4.

## Secrets: what they are and where they live

| Secret | Where it lives | If it leaks |
|---|---|---|
| `DATABASE_URL` (contains the password) | `.env.local`, Vercel settings | Anyone can read and change all data. Reset the database password in Aiven and update both places |
| `NEXTAUTH_SECRET` | `.env.local`, Vercel settings | Sessions can be forged, including admin ones. Replace it (this signs everyone out) |
| `GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_SECRET` | `.env.local`, Vercel settings | Rotate in the provider's console |
| `DATABASE_CA` | `.env.local`, Vercel settings | Not secret (it is a public certificate) |
| `BANK_*` | `.env.local`, Vercel settings | These are shown to customers anyway |

Rules of thumb: never paste these into chat, issues or screenshots; never commit them; use a different `NEXTAUTH_SECRET` online than on your computer. `.env.local` may still contain a `VERCEL_OIDC_TOKEN` line left over from the previous owner's Vercel setup. The site does not use it; it can be deleted.

## Reporting a problem

If you find a security problem, fix it first and describe it in the commit message, then update this page.
