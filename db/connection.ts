// Turns DATABASE_URL into connection options, shared by the app and drizzle-kit.
//
// Local PostgreSQL:  postgres://YOUR_MAC_USERNAME@localhost:5432/sceill
// Aiven:             postgres://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require
//
// Hosted databases need an encrypted (TLS) connection. The "sslmode" setting in the
// URL is translated here so the behaviour is explicit.
//   DATABASE_CA   (recommended) the provider's CA certificate, pasted as text.
//                 With it, the server's identity is verified.
//   DATABASE_SSL  set to "true" to force TLS without a certificate.
export function getConnectionOptions(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local (see .env.example).")
  }

  const url = new URL(databaseUrl)
  const sslMode = url.searchParams.get("sslmode")?.toLowerCase()
  const ca = process.env.DATABASE_CA?.replace(/\\n/g, "\n").trim()
  const wantsTls =
    (!!sslMode && sslMode !== "disable") || process.env.DATABASE_SSL === "true" || !!ca

  const password = decodeURIComponent(url.password)

  // keys with no value are left out so the drivers fall back to their own defaults
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    ...(password && { password }),
    database: decodeURIComponent(url.pathname.slice(1)),
    ...(wantsTls && {
      ssl: ca
        ? { ca, rejectUnauthorized: true }
        : { rejectUnauthorized: false }, // encrypted, but the server is not verified
    }),
  }
}
