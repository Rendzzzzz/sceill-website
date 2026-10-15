import { NextResponse } from "next/server"
import { resetPasswordSchema } from "../../../lib/validations/auth"
import { resetPassword } from "../../../lib/password-reset"
import { validationError } from "../../../lib/admin"

// Step 2: the token from step 1 plus the new password.
export async function POST(request: Request) {
  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.issues)

  let who
  try {
    who = await resetPassword(parsed.data.token, parsed.data.password)
  } catch (error) {
    console.error("reset password failed", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }

  if (!who) {
    return NextResponse.json(
      { error: "This reset session is invalid or has expired. Please start again." },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
}
