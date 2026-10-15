"use client"

import { useState } from "react"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setStatus("success")
      setEmail("")
    } catch {
      setStatus("error")
    }
  }

  return (
    <section className="bg-ink py-24 text-cream">
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gold">The inner circle</p>
        <h2 className="text-4xl sm:text-5xl">Enjoy SCEILL exclusive offers</h2>
        <p className="mb-8 mt-4 text-cream/60">
          New launches, private promotions and fragrance notes, delivered sparingly.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <Input
            id="newsletter-email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 flex-1 rounded-lg border-white/20 bg-white/10 text-cream placeholder:text-cream/40 focus:ring-gold"
          />
          <Button type="submit" variant="gold" size="lg" disabled={status === "loading"}>
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>

        <p className="mt-4 min-h-6 text-sm" role="status" aria-live="polite">
          {status === "success" && <span className="text-gold">Thank you for subscribing!</span>}
          {status === "error" && (
            <span className="text-red-400">Something went wrong. Please try again.</span>
          )}
        </p>
      </div>
    </section>
  )
}
