"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm, type FieldValues, type Path, type UseFormSetError } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Field, inputClass } from "../../components/auth/AuthShell"
import { RegionFields } from "../../components/auth/RegionFields"
import {
  addressSchema,
  passwordChangeFormSchema,
  personalSchema,
  type AddressInput,
  type PasswordChangeFormInput,
  type PersonalInput,
} from "../../lib/validations/profile"
import type { Profile } from "../../lib/profile"

type Status = { type: "success" | "error"; text: string } | null

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-8 rounded-xl border bg-white/60 p-6 sm:p-8">
      <h2 className="text-3xl">{title}</h2>
      <p className="mb-6 mt-1 text-sm text-muted">{description}</p>
      {children}
    </section>
  )
}

function StatusMessage({ status }: { status: Status }) {
  // always rendered so screen readers announce changes
  return (
    <p
      className={`min-h-6 text-sm ${status?.type === "error" ? "text-red-700" : "text-gold-dark"}`}
      role={status?.type === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {status?.text}
    </p>
  )
}

// The API reports problems as "field: message". Show them next to the right input.
async function readError<T extends FieldValues>(
  res: Response,
  setError: UseFormSetError<T>,
  fields: string[]
): Promise<string> {
  const data = await res.json().catch(() => ({}))
  const raw: string = data.error ?? "Something went wrong. Please try again."
  const [field, ...rest] = raw.split(": ")
  if (rest.length && fields.includes(field)) {
    setError(field as Path<T>, { message: rest.join(": ") })
    return "Please check the highlighted field."
  }
  return raw
}

function PersonalForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const { update } = useSession()
  const [status, setStatus] = useState<Status>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PersonalInput>({
    resolver: zodResolver(personalSchema),
    defaultValues: { name: profile.name, phone: profile.phone },
  })

  const onSubmit = async (values: PersonalInput) => {
    setStatus(null)
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "personal", ...values }),
    }).catch(() => null)

    if (!res) return setStatus({ type: "error", text: "Network error. Check your connection and try again." })
    if (!res.ok) return setStatus({ type: "error", text: await readError(res, setError, ["name", "phone"]) })

    const saved: Profile = await res.json()
    reset({ name: saved.name, phone: saved.phone })
    await update() // refresh the name shown in the header
    router.refresh()
    setStatus({ type: "success", text: "Your details were saved." })
  }

  return (
    <Section title="Personal details" description="Your name and how we can reach you about orders.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <input id="name" autoComplete="name" aria-invalid={!!errors.name} className={inputClass} {...register("name")} />
        </Field>

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            value={profile.email}
            disabled
            readOnly
            className={`${inputClass} cursor-not-allowed bg-sand/40 text-muted`}
            aria-describedby="email-note"
          />
          <p id="email-note" className="mt-1.5 text-xs text-muted">Your email is your sign-in and can&apos;t be changed.</p>
        </Field>

        <Field label="Phone (optional)" htmlFor="phone" error={errors.phone?.message}>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0812 3456 7890"
            aria-invalid={!!errors.phone}
            className={inputClass}
            {...register("phone")}
          />
        </Field>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Saving..." : "Save details"}
          </Button>
          <StatusMessage status={status} />
        </div>
      </form>
    </Section>
  )
}

function AddressForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(null)
  const defaults: AddressInput = {
    provinceId: profile.provinceCode,
    regencyId: profile.cityCode,
    districtId: profile.districtCode,
    address: profile.address,
    postalCode: profile.postalCode,
  }
  const form = useForm<AddressInput>({ resolver: zodResolver(addressSchema), defaultValues: defaults })
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = form

  const onSubmit = async (values: AddressInput) => {
    setStatus(null)
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "address", ...values }),
    }).catch(() => null)

    if (!res) return setStatus({ type: "error", text: "Network error. Check your connection and try again." })
    if (!res.ok) {
      return setStatus({
        type: "error",
        text: await readError(res, setError, ["provinceId", "regencyId", "districtId", "address", "postalCode"]),
      })
    }

    const saved: Profile = await res.json()
    reset({
      provinceId: saved.provinceCode,
      regencyId: saved.cityCode,
      districtId: saved.districtCode,
      address: saved.address,
      postalCode: saved.postalCode,
    })
    router.refresh()
    setStatus({ type: "success", text: "Your delivery address was saved." })
  }

  return (
    <Section title="Delivery address" description="Where we send your orders. All fields except postal code are required.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <RegionFields form={form} bare />

        <Field label="Postal code (optional)" htmlFor="postalCode" error={errors.postalCode?.message}>
          <input
            id="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="12620"
            aria-invalid={!!errors.postalCode}
            className={`${inputClass} sm:max-w-48`}
            {...register("postalCode")}
          />
        </Field>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Saving..." : "Save address"}
          </Button>
          <StatusMessage status={status} />
        </div>
      </form>
    </Section>
  )
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [status, setStatus] = useState<Status>(null)
  const [show, setShow] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeFormInput>({
    resolver: zodResolver(passwordChangeFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  if (!hasPassword) {
    return (
      <Section title="Password" description="Keep your account secure.">
        <p className="text-sm text-muted">
          You sign in with Google or Apple, so there is no password to manage here.
        </p>
      </Section>
    )
  }

  const onSubmit = async ({ currentPassword, newPassword }: PasswordChangeFormInput) => {
    setStatus(null)
    const res = await fetch("/api/profile/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    }).catch(() => null)

    if (!res) return setStatus({ type: "error", text: "Network error. Check your connection and try again." })
    if (!res.ok) return setStatus({ type: "error", text: await readError(res, setError, ["currentPassword", "newPassword"]) })

    reset()
    setStatus({ type: "success", text: "Your password was changed." })
  }

  const type = show ? "text" : "password"
  return (
    <Section title="Password" description="Use at least 8 characters, with a letter and a number.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
          <input
            id="currentPassword"
            type={type}
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            className={inputClass}
            {...register("currentPassword")}
          />
        </Field>

        <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
          <div className="relative">
            <input
              id="newPassword"
              type={type}
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              className={`${inputClass} pr-12`}
              {...register("newPassword")}
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
            {...register("confirmPassword")}
          />
        </Field>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Changing..." : "Change password"}
          </Button>
          <StatusMessage status={status} />
        </div>
      </form>
    </Section>
  )
}

export function ProfileForms({ profile }: { profile: Profile }) {
  return (
    <>
      <PersonalForm profile={profile} />
      <AddressForm profile={profile} />
      <PasswordForm hasPassword={profile.hasPassword} />
    </>
  )
}
