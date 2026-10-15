import type { Metadata } from "next"
import { ForgotPasswordForm } from "./ForgotPasswordForm"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Get a link to reset your SCEILL password.",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
