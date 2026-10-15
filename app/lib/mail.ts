// Server-only: sending email through any SMTP provider (Brevo, Resend, Gmail, ...).
//
//   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS, MAIL_FROM
//
// Without these, in development the message is printed in the terminal so the flow can
// be tested. In production a missing configuration is an error: it is never silently
// ignored, and the content (which may hold a reset link) is never printed.
import nodemailer from "nodemailer"

export interface Mail {
  to: string
  subject: string
  text: string
  html: string
}

function smtpSettings() {
  const host = process.env.SMTP_HOST?.trim()
  const from = process.env.MAIL_FROM?.trim()
  if (!host || !from) return null
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()
  // a user name without its password is a half-finished setup: treat it as "not configured"
  // (the dev terminal fallback, or the clear production error) instead of failing the login
  if (user && !pass) return null
  return { host, port, from, ...(user && { auth: { user, pass: pass! } }) }
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

export async function sendMail(mail: Mail) {
  const smtp = smtpSettings()

  if (!smtp) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM.")
    }
    console.log(
      [
        "",
        "────────── EMAIL (development: not sent, SMTP is not configured) ──────────",
        `To:      ${mail.to}`,
        `Subject: ${mail.subject}`,
        "",
        mail.text,
        "────────────────────────────────────────────────────────────────────────",
        "",
      ].join("\n")
    )
    return
  }

  transporter ??= nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465, // 465 is encrypted from the start; others upgrade with STARTTLS
    auth: smtp.auth,
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  })
  await transporter.sendMail({ from: smtp.from, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html })
}
