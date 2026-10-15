// The text of the emails. Kept plain on purpose: a short HTML version and a text version.
import { getSiteUrl } from "./site-url"
import type { Mail } from "./mail"

const escapeHtml = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

function layout(name: string, bodyHtml: string) {
  return `<div style="background:#f7f3ec;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#14110f">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e9e1d3;border-radius:12px;padding:32px">
    <p style="margin:0 0 24px;font-size:20px;letter-spacing:6px">SCEILL</p>
    <p style="margin:0 0 16px">Hello ${escapeHtml(name)},</p>
    ${bodyHtml}
    <p style="margin:24px 0 0;font-size:12px;color:#6b645b">SCEILL &middot; This is an automated message.</p>
  </div>
</div>`
}

export function resetPasswordEmail(to: string, name: string, link: string, validMinutes: number): Mail {
  return {
    to,
    subject: "Reset your SCEILL password",
    text: [
      `Hello ${name},`,
      "",
      "We received a request to reset the password of your SCEILL account.",
      `Open this link to choose a new password (valid for ${validMinutes} minutes, one use only):`,
      "",
      link,
      "",
      "If you did not ask for this, you can ignore this email. Your password will not change.",
    ].join("\n"),
    html: layout(
      name,
      `<p style="margin:0 0 16px">We received a request to reset the password of your SCEILL account.</p>
    <p style="margin:0 0 24px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#14110f;color:#f7f3ec;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:13px;letter-spacing:1px">CHOOSE A NEW PASSWORD</a></p>
    <p style="margin:0 0 8px;font-size:13px;color:#6b645b">The link is valid for ${validMinutes} minutes and can be used once. If the button does not work, copy this address into your browser:</p>
    <p style="margin:0 0 16px;font-size:12px;word-break:break-all;color:#6b645b">${escapeHtml(link)}</p>
    <p style="margin:0;font-size:13px">If you did not ask for this, ignore this email. Your password will not change.</p>`
    ),
  }
}

// For accounts that sign in with Google or Apple and so have no password to reset
export function socialAccountEmail(to: string, name: string): Mail {
  const site = getSiteUrl()
  return {
    to,
    subject: "Signing in to SCEILL",
    text: [
      `Hello ${name},`,
      "",
      "Someone asked to reset the password for this email address. Your SCEILL account signs in with Google or Apple, so it has no password to reset.",
      `Go to ${site}/login and choose "Continue with Google" or "Continue with Apple".`,
      "",
      "If you did not ask for this, you can ignore this email.",
    ].join("\n"),
    html: layout(
      name,
      `<p style="margin:0 0 16px">Someone asked to reset the password for this email address. Your SCEILL account signs in with <strong>Google or Apple</strong>, so it has no password to reset.</p>
    <p style="margin:0 0 16px"><a href="${escapeHtml(site)}/login">Go to the sign-in page</a> and choose &ldquo;Continue with Google&rdquo; or &ldquo;Continue with Apple&rdquo;.</p>
    <p style="margin:0;font-size:13px">If you did not ask for this, ignore this email.</p>`
    ),
  }
}

export function passwordChangedEmail(to: string, name: string): Mail {
  const site = getSiteUrl()
  return {
    to,
    subject: "Your SCEILL password was changed",
    text: [
      `Hello ${name},`,
      "",
      "The password of your SCEILL account was just changed.",
      "If this was you, no action is needed.",
      `If it was not, reset it right away at ${site}/forgot-password and contact us.`,
    ].join("\n"),
    html: layout(
      name,
      `<p style="margin:0 0 16px">The password of your SCEILL account was just changed.</p>
    <p style="margin:0 0 16px">If this was you, no action is needed.</p>
    <p style="margin:0;font-size:13px">If it was not, <a href="${escapeHtml(site)}/forgot-password">reset it right away</a> and contact us.</p>`
    ),
  }
}
