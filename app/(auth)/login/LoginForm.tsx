"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { loginSchema, type LoginInput } from "../../lib/validations/auth"
import { safeCallbackUrl } from "../../lib/utils"
import { AuthShell, Field, inputClass } from "../../components/auth/AuthShell"
import { OrDivider, SocialButtons } from "../../components/auth/SocialButtons"
import { Button } from "../../components/ui/Button"

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"))
  const [showPassword, setShowPassword] = useState(false)
  // NextAuth sends users back here with ?error=... when a Google/Apple sign-in fails
  const [formError, setFormError] = useState<string | null>(
    params.get("error") ? "We could not sign you in. Please try again." : null
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async ({ email, password }: LoginInput) => {
    setFormError(null)
    const result = await signIn("credentials", { email, password, redirect: false })
    if (result?.error) {
      setFormError("Incorrect email or password.")
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your account"
      footer={
        <>
          New to SCEILL?{" "}
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-medium text-ink underline underline-offset-4"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
              autoComplete="current-password"
              aria-invalid={!!errors.password}
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
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-xs text-muted underline underline-offset-4 hover:text-ink">
              Forgot password?
            </Link>
          </div>
        </Field>

        {params.get("reset") === "1" && !formError && (
          <p className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm" role="status">
            Your password was changed. Sign in with your new password.
          </p>
        )}

        {formError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <OrDivider />
      <SocialButtons callbackUrl={callbackUrl} />
    </AuthShell>
  )
}
