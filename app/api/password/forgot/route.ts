import { NextResponse } from "next/server"
import { forgotPasswordSchema } from "../../../lib/validations/auth"
import { RESET_VALID_MINUTES, requestPasswordReset } from "../../../lib/password-reset"

// Step 1 of changing a forgotten password. There is no email: this says whether the address
// has an account, and if it can be reset, hands back a short-lived token for step 2.
//
// This reveals which emails are registered, and it does not prove the caller owns the account.
// See lib/password-reset.ts.
export async function POST(request: Request) {
  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "email: Enter a valid email address" }, { status: 400 })
  }

  let result
  try {
    result = await requestPasswordReset(parsed.data.email)
  } catch (error) {
    console.error("forgot password failed", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }

  if (result.status === "throttled") {
    return NextResponse.json({ error: "Too many attempts for this account. Please try again in an hour." }, { status: 429 })
  }
  if (result.status === "found") {
    return NextResponse.json({ status: "found", email: result.email, token: result.token, validMinutes: RESET_VALID_MINUTES })
  }
  return NextResponse.json({ status: result.status })
}
