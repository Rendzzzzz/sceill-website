import { z } from "zod"

// bcrypt only uses the first 72 bytes, so longer passwords are rejected up front
export const passwordRule = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number")

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email")
  .max(254, "Email is too long")
  .pipe(z.email("Enter a valid email address"))

// delivery address, shared by registration and the profile page
export const addressFields = {
  // official region codes: 2, 4 and 7 digits
  provinceId: z.string().regex(/^\d{2}$/, "Select your province"),
  regencyId: z.string().regex(/^\d{4}$/, "Select your city or regency"),
  districtId: z.string().regex(/^\d{7}$/, "Select your district"),
  address: z
    .string()
    .trim()
    .min(10, "Enter your full street address (at least 10 characters)")
    .max(255, "Address is too long (255 characters max)"),
}

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
  email,
  password: passwordRule,
  ...addressFields,
})

export const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(72),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type RegisterFormInput = z.infer<typeof registerFormSchema>
export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "This reset link is not valid").max(200, "This reset link is not valid"),
  password: passwordRule,
})

export const resetPasswordFormSchema = z
  .object({ password: passwordRule, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>
