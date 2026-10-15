// The public address of the site, used for links inside emails.
// It is read from configuration, never from the incoming request: a request's Host
// header can be forged, which would let someone put their own address in the email.
export function getSiteUrl() {
  const raw =
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000"
  const withScheme = /^https?:\/\//.test(raw) ? raw : `https://${raw}`
  return withScheme.replace(/\/+$/, "")
}
