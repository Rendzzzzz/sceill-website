import { BottleArt } from "./BottleArt"
import { cn } from "../../lib/utils"

// Admins can paste any image URL, so this uses a plain <img> instead of next/image
// (which only optimizes hosts listed in next.config.js).
export function ProductImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src?: string | null
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
}) {
  if (!src) return <BottleArt className={cn("h-full w-full", className)} />

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
    />
  )
}
