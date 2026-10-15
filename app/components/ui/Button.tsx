import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'gold' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function Button({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-wide uppercase text-xs transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
  const variants = {
    default: "bg-ink text-cream hover:bg-ink-soft",
    gold: "bg-gold text-white hover:bg-gold-dark",
    outline: "border border-ink/30 bg-transparent hover:bg-ink hover:text-cream",
    ghost: "bg-transparent hover:bg-sand/60",
  }
  const sizes = {
    default: "h-11 px-6",
    sm: "h-9 px-4",
    lg: "h-14 px-10 text-sm"
  }

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
