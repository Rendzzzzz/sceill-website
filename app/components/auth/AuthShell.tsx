import Link from "next/link"

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-14">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-3xl tracking-[0.3em]">SCEILL</Link>
          <h1 className="mt-8 text-4xl">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
        </div>
        <div className="rounded-xl border bg-white/60 p-6 sm:p-8">{children}</div>
        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </div>
    </main>
  )
}

export function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string
  error?: string
  children: React.ReactNode
  htmlFor: string
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-muted">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export const inputClass =
  "h-12 w-full rounded-lg border border-ink/20 bg-white px-4 text-sm placeholder:text-muted/60 focus:border-ink aria-[invalid=true]:border-red-600"
