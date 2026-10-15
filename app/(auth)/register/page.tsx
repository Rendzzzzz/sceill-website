import type { Metadata } from "next"
import { Suspense } from "react"
import { RegisterForm } from "./RegisterForm"

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your SCEILL account to shop and track orders.",
}

export default function RegisterPage() {
  // RegisterForm reads the URL (?callbackUrl=), which needs a Suspense boundary
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
