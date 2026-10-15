"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Landmark, MapPin, ShoppingBag } from "lucide-react"
import { useCart } from "../lib/cart"
import { formatPrice } from "../lib/utils"
import { phoneRule } from "../lib/validations/profile"
import { Button } from "../components/ui/Button"
import { BottleArt } from "../components/product/BottleArt"
import { Field, inputClass } from "../components/auth/AuthShell"
import type { Quote } from "../lib/orders"

async function fetchQuote(items: { id: string; quantity: number }[], signal?: AbortSignal): Promise<Quote> {
  const res = await fetch("/api/cart/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: items.map((i) => ({ productId: i.id, quantity: i.quantity })) }),
    signal,
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

interface Customer {
  name: string
  email: string
  phone: string
  address: string
  district: string
  city: string
  province: string
  postalCode: string
}

export function CheckoutClient({ customer }: { customer: Customer }) {
  const router = useRouter()
  const { items, ready, clear, setQuantity, removeItem } = useCart()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteFailed, setQuoteFailed] = useState(false)
  const [phone, setPhone] = useState(customer.phone)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasAddress = !!customer.address && !!customer.district
  // changes whenever a line is added, removed or its quantity changes
  const bagSignature = items.map((i) => `${i.id}:${i.quantity}`).join("|")

  // Ask the server for the current price and stock of what is in the bag
  const loadQuote = useCallback(() => {
    fetchQuote(items)
      .then((q) => {
        setQuote(q)
        setQuoteFailed(false)
      })
      .catch(() => setQuoteFailed(true))
  }, [items])

  useEffect(() => {
    if (!ready || !bagSignature) return
    const controller = new AbortController()
    fetchQuote(items, controller.signal)
      .then((q) => {
        setQuote(q)
        setQuoteFailed(false)
      })
      .catch((e) => {
        if (e.name !== "AbortError") setQuoteFailed(true)
      })
    return () => controller.abort()
    // `items` is read inside, but bagSignature already changes whenever items does
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, bagSignature])

  // remove what is gone and lower quantities to what is in stock
  const fixBag = () => {
    if (!quote) return
    const keep = new Map(quote.lines.map((l) => [l.productId, l]))
    for (const item of items) {
      const line = keep.get(item.id)
      const blocked = quote.issues.some((i) => i.productId === item.id)
      if (!line) removeItem(item.id)
      else if (blocked) setQuantity(item.id, line.maxQuantity)
    }
    setQuote(null)
  }

  const placeOrder = async () => {
    setError(null)
    const parsed = phoneRule.refine((v) => v !== "", "Enter a phone number for the courier").safeParse(phone)
    if (!parsed.success) return setPhoneError(parsed.error.issues[0].message)
    setPhoneError(null)

    setSubmitting(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
          phone,
          note: note || undefined,
          paymentMethod: "bank_transfer",
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) return router.push("/login?callbackUrl=/checkout")
      if (!res.ok) {
        setError(data.error ?? "We could not place your order. Please try again.")
        setQuote(null)
        loadQuote()
        return
      }
      clear()
      router.push(`/user/orders/${data.orderNumber}?placed=1`)
    } catch {
      setError("Network error. Check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) {
    return <main className="container mx-auto px-4 py-24 text-center text-muted">Loading your bag...</main>
  }

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-32 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-gold" strokeWidth={1.25} />
        <h1 className="mt-6 text-5xl">Your bag is empty</h1>
        <p className="mt-3 text-muted">Add a fragrance before checking out.</p>
        <Link href="/catalog" className="mt-8 inline-block">
          <Button size="lg">Explore the collection</Button>
        </Link>
      </main>
    )
  }

  const blocked = !hasAddress || !quote || quote.issues.length > 0 || quote.lines.length === 0

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="mb-10 text-5xl">Checkout</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_26rem]">
        <div className="space-y-8">
          {/* delivery */}
          <section className="rounded-xl border bg-white/60 p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-3xl">
              <MapPin className="h-5 w-5 text-gold" strokeWidth={1.5} /> Delivery
            </h2>
            {hasAddress ? (
              <div className="mt-4 text-sm leading-relaxed">
                <p className="font-medium">{customer.name}</p>
                <p className="text-muted">{customer.address}</p>
                <p className="text-muted">
                  {customer.district}, {customer.city}, {customer.province}
                  {customer.postalCode ? ` ${customer.postalCode}` : ""}
                </p>
                <Link href="/user/profile" className="mt-3 inline-block text-xs uppercase tracking-widest underline underline-offset-4">
                  Change address
                </Link>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm" role="alert">
                You need a delivery address before you can order.{" "}
                <Link href="/user/profile" className="font-medium underline underline-offset-4">
                  Add it in your profile
                </Link>
                , then come back. Your bag will still be here.
              </div>
            )}

            <div className="mt-6 max-w-sm">
              <Field label="Phone number for the courier" htmlFor="phone" error={phoneError ?? undefined}>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0812 3456 7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={!!phoneError}
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          {/* payment */}
          <section className="rounded-xl border bg-white/60 p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-3xl">
              <Landmark className="h-5 w-5 text-gold" strokeWidth={1.5} /> Payment
            </h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-ink bg-white p-4">
              <input type="radio" name="payment" checked readOnly className="mt-1 accent-[#14110f]" />
              <span>
                <span className="block font-medium">Bank transfer</span>
                <span className="block text-sm text-muted">
                  You will get our bank details right after placing the order. Please pay within 24 hours or the order is
                  cancelled automatically.
                </span>
              </span>
            </label>
          </section>

          <section className="rounded-xl border bg-white/60 p-6 sm:p-8">
            <h2 className="text-3xl">Note</h2>
            <label htmlFor="note" className="sr-only">Note for the seller</label>
            <textarea
              id="note"
              rows={3}
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Gift message or delivery instructions (optional)"
              className={`${inputClass} mt-4 h-auto resize-none py-3`}
            />
          </section>
        </div>

        {/* summary */}
        <aside className="h-fit space-y-5 rounded-xl border bg-sand/40 p-6 lg:sticky lg:top-24">
          <h2 className="text-3xl">Order summary</h2>

          {quoteFailed && (
            <p className="text-sm text-red-700" role="alert">
              Could not load the latest prices.{" "}
              <button type="button" onClick={loadQuote} className="cursor-pointer underline underline-offset-4">
                Try again
              </button>
            </p>
          )}

          {!quote && !quoteFailed && <p className="text-sm text-muted">Checking prices and stock...</p>}

          {quote && (
            <>
              <ul className="divide-y">
                {quote.lines.map((l) => (
                  <li key={l.productId} className="flex gap-3 py-3">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                      {l.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <BottleArt className="h-full w-full" />
                      )}
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="text-lg leading-tight">{l.name}</p>
                      <p className="text-muted tabular-nums">
                        {formatPrice(l.unitPrice)} × {l.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums">{formatPrice(l.lineTotal)}</p>
                  </li>
                ))}
              </ul>

              {quote.issues.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                  <ul className="list-disc space-y-1 pl-4">
                    {quote.issues.map((i) => (
                      <li key={i.productId}>
                        {i.name} {i.message}.
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={fixBag} className="mt-2 cursor-pointer font-medium underline underline-offset-4">
                    Update my bag
                  </button>
                </div>
              )}

              <dl className="space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(quote.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="tabular-nums">{quote.shippingFee === 0 ? "Free" : formatPrice(quote.shippingFee)}</dd>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg">
                  <dt>Total</dt>
                  <dd className="font-medium tabular-nums">{formatPrice(quote.total)}</dd>
                </div>
              </dl>
            </>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          )}

          <Button size="lg" className="w-full" disabled={blocked || submitting} onClick={placeOrder}>
            {submitting ? "Placing order..." : "Place order"}
          </Button>
          <Link href="/cart" className="block text-center text-xs uppercase tracking-widest underline-offset-4 hover:underline">
            Back to bag
          </Link>
        </aside>
      </div>
    </main>
  )
}
