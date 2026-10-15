"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, ShieldAlert, UserX } from "lucide-react"
import {
  forgotPasswordSchema,
  resetPasswordFormSchema,
  type ForgotPasswordInput,
  type ResetPasswordFormInput,
} from "../../lib/validations/auth"
import { AuthShell, Field, inputClass } from "../../components/auth/AuthShell"
import { Button } from "../../components/ui/Button"

// What step 1 found out about the email
type Step =
  | { name: "email" }
  | { name: "password"; email: string; token: string; validMinutes: number }
  | { name: "not_found"; email: string }
  | { name: "social"; email: string }
  | { name: "admin"; email: string }
  | { name: "expired" }

const linkClass = "font-medium text-ink underline underline-offset-4"

export function ForgotPasswordForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>({ name: "email" })
  const [formError, setFormError] = useState<string | null>(null)
  const [show, setShow] = useState(false)

  const emailForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })
  const passwordForm = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  const startOver = () => {
    setFormError(null)
    passwordForm.reset()
    setStep({ name: "email" })
  }

  // Step 1: does this email have an account?
  const checkEmail = async ({ email }: ForgotPasswordInput) => {
    setFormError(null)
    const res = await fetch("/api/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null)

    if (!res) return setFormError("Network error. Check your connection and try again.")
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return setFormError((data.error as string | undefined)?.replace(/^email: /, "") ?? "Something went wrong. Please try again.")
    }

    switch (data.status) {
      case "found":
        return setStep({ name: "password", email: data.email, token: data.token, validMinutes: data.validMinutes })
      case "not_found":
        return setStep({ name: "not_found", email })
      case "social":
        return setStep({ name: "social", email })
      case "admin":
        return setStep({ name: "admin", email })
      default:
        return setFormError("Something went wrong. Please try again.")
    }
  }

  // Step 2: save the new password
  const savePassword = async ({ password }: ResetPasswordFormInput) => {
    if (step.name !== "password") return
    setFormError(null)
    const res = await fetch("/api/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: step.token, password }),
    }).catch(() => null)

    if (!res) return setFormError("Network error. Check your connection and try again.")
    if (res.ok) return router.push("/login?reset=1")

    const data = await res.json().catch(() => ({}))
    const message: string = data.error ?? "Something went wrong. Please try again."
    if (/invalid or has expired/.test(message)) return setStep({ name: "expired" })
    const [field, ...rest] = message.split(": ")
    if (rest.length && field === "password") {
      passwordForm.setError("password", { message: rest.join(": ") })
      return setFormError("Please check the highlighted field.")
    }
    setFormError(message)
  }

  const footer = (
    <Link href="/login" className={linkClass}>
      Back to sign in
    </Link>
  )

  const errorBox = formError && (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
      {formError}
    </p>
  )

  if (step.name === "not_found") {
    return (
      <AuthShell title="No account found" subtitle="We could not find that email" footer={footer}>
        <div className="space-y-5 text-center" role="status">
          <UserX className="mx-auto h-10 w-10 text-gold" strokeWidth={1.25} />
          <p>
            There is no account for <span className="break-all font-medium">{step.email}</span>.
          </p>
          <div className="space-y-3">
            <Button type="button" size="lg" className="w-full" onClick={startOver}>
              Try another email
            </Button>
            <Link href="/register" className="block text-xs uppercase tracking-widest underline underline-offset-4">
              Create an account
            </Link>
          </div>
        </div>
      </AuthShell>
    )
  }

  if (step.name === "social") {
    return (
      <AuthShell title="No password to change" subtitle="This account uses Google or Apple" footer={footer}>
        <div className="space-y-5 text-center" role="status">
          <p>
            <span className="break-all font-medium">{step.email}</span> signs in with Google or Apple, so it has no password.
          </p>
          <Link href="/login" className="block">
            <Button size="lg" className="w-full">Go to sign in</Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  if (step.name === "admin") {
    return (
      <AuthShell title="Cannot be reset here" subtitle="This is an administrator account" footer={footer}>
        <div className="space-y-5 text-center" role="status">
          <ShieldAlert className="mx-auto h-10 w-10 text-gold" strokeWidth={1.25} />
          <p className="text-sm text-muted">
            For security, administrator passwords cannot be changed from this page. Please contact the site owner.
          </p>
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={startOver}>
            Try another email
          </Button>
        </div>
      </AuthShell>
    )
  }

  if (step.name === "expired") {
    return (
      <AuthShell title="This session has expired" subtitle="It was used or timed out" footer={footer}>
        <Button type="button" size="lg" className="w-full" onClick={startOver}>
          Start again
        </Button>
      </AuthShell>
    )
  }

  if (step.name === "password") {
    const type = show ? "text" : "password"
    const { errors, isSubmitting } = passwordForm.formState
    return (
      <AuthShell
        title="Choose a new password"
        subtitle={`For ${step.email}. Use at least 8 characters, with a letter and a number`}
        footer={footer}
      >
        <form onSubmit={passwordForm.handleSubmit(savePassword)} noValidate className="space-y-5">
          <Field label="New password" htmlFor="password" error={errors.password?.message}>
            <div className="relative">
              <input
                id="password"
                type={type}
                autoComplete="new-password"
                autoFocus
                aria-invalid={!!errors.password}
                className={`${inputClass} pr-12`}
                {...passwordForm.register("password")}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-muted hover:text-ink"
                aria-label={show ? "Hide passwords" : "Show passwords"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <input
              id="confirmPassword"
              type={type}
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              className={inputClass}
              {...passwordForm.register("confirmPassword")}
            />
          </Field>

          {errorBox}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Change password"}
          </Button>
          <p className="text-center text-xs text-muted">
            Not your account?{" "}
            <button type="button" onClick={startOver} className="cursor-pointer underline underline-offset-4">
              Use a different email
            </button>
          </p>
        </form>
      </AuthShell>
    )
  }

  const { errors, isSubmitting } = emailForm.formState
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email to check your account and choose a new password"
      footer={footer}
    >
      <form onSubmit={emailForm.handleSubmit(checkEmail)} noValidate className="space-y-5">
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            aria-invalid={!!errors.email}
            className={inputClass}
            {...emailForm.register("email")}
          />
        </Field>

        {errorBox}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Checking..." : "Continue"}
        </Button>
      </form>
    </AuthShell>
  )
}
