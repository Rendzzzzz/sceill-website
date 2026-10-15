import { z } from "zod"
import { addressFields, passwordRule } from "./auth"

// spaces and dashes are allowed when typing; digits (and a leading +) are what is kept
export const phoneRule = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => v === "" || /^\+?[0-9]{8,15}$/.test(v), "Enter a valid phone number, e.g. 0812 3456 7890")

const postalCode = z
  .string()
  .trim()
  .refine((v) => v === "" || /^[0-9]{5}$/.test(v), "Postal code is 5 digits")

export const personalSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
  phone: phoneRule,
})

export const addressSchema = z.object({
  ...addressFields,
  postalCode,
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(72),
    newPassword: passwordRule,
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from the current one",
  })

export const passwordChangeFormSchema = passwordChangeSchema
  .safeExtend({ confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

export type PersonalInput = z.infer<typeof personalSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type PasswordChangeFormInput = z.infer<typeof passwordChangeFormSchema>
