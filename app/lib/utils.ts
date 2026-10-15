import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number) {
  return `Rp ${Number(value).toLocaleString('id-ID')}`
}

// Only allow redirects to paths on this site ("/cart"), never "//evil.com" or "https://..."
export function safeCallbackUrl(value: string | null | undefined, fallback = "/") {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback
}
