"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { registerFormSchema, type RegisterFormInput } from "../../lib/validations/auth"
import { safeCallbackUrl } from "../../lib/utils"
import { AuthShell, Field, inputClass } from "../../components/auth/AuthShell"
import { OrDivider, SocialButtons } from "../../components/auth/SocialButtons"
import { RegionFields } from "../../components/auth/RegionFields"
import { Button } from "../../components/ui/Button"

export function RegisterForm() {
  const router = useRouter()
  const callbackUrl = safeCallbackUrl(useSearchParams().get("callbackUrl"))
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      provinceId: "",
      regencyId: "",
      districtId: "",
      address: "",
    },
  })
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form

  const onSubmit = async (values: RegisterFormInput) => {
    // confirmPassword is only for the form; the server never needs it
    const { name, email, password, provinceId, regencyId, districtId, address } = values
    const details = { name, email, password, provinceId, regencyId, districtId, address }
    setFormError(null)

    let res: Response
    try {
      res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      })
    } catch {
      setFormError("Network error. Check your connection and try again.")
      return
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      for (const [field, message] of Object.entries(data.fieldErrors ?? {})) {
        if (field in details) setError(field as keyof RegisterFormInput, { message: String(message) })
      }
      setFormError(data.error ?? "Something went wrong. Please try again.")
      return
    }

    // account created: sign in straight away
    const result = await signIn("credentials", { email, password, redirect: false })
    if (result?.error) {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join SCEILL to shop, save your bag and track orders"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-medium text-ink underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SocialButtons callbackUrl={callbackUrl} />
      <OrDivider />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            aria-invalid={!!errors.name}
            className={inputClass}
            {...register("name")}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className={inputClass}
            {...register("email")}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby="password-hint"
              className={`${inputClass} pr-12`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-muted hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p id="password-hint" className="mt-1.5 text-xs text-muted">
            At least 8 characters, with a letter and a number.
          </p>
        </Field>

        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            className={inputClass}
            {...register("confirmPassword")}
          />
        </Field>

        <RegionFields form={form} />

        {formError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-center text-xs text-muted">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  )
}
