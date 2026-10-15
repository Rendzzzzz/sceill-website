"use client"

import Link from "next/link"
import { Minus, Plus, ShoppingBag, X } from "lucide-react"
import { useCart } from "../lib/cart"
import { formatPrice } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { FREE_SHIPPING_THRESHOLD } from "../lib/shipping"
import { BottleArt } from "../components/product/BottleArt"

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem } = useCart()
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-32 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-gold" strokeWidth={1.25} />
        <h1 className="mt-6 text-5xl">Your bag is empty</h1>
        <p className="mt-3 text-muted">Find a fragrance that tells your story.</p>
        <Link href="/catalog" className="mt-8 inline-block">
          <Button size="lg">Explore the collection</Button>
        </Link>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="mb-10 text-5xl">Your bag</h1>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        <ul className="divide-y border-y">
          {items.map((item) => (
            <li key={item.id} className="flex gap-5 py-6">
              <Link
                href={`/product/${item.slug || item.id}`}
                className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-sand"
              >
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <BottleArt className="h-full w-full" />
                )}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <Link href={`/product/${item.slug || item.id}`} className="text-2xl leading-tight hover:text-gold-dark">
                    {item.name}
                  </Link>
                  <p className="font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                </div>
                <p className="mt-1 text-sm text-muted tabular-nums">{formatPrice(item.price)} each</p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex items-center overflow-hidden rounded-lg border border-ink/30">
                    <button
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center hover:bg-sand/60"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center hover:bg-sand/60"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex cursor-pointer items-center gap-1 text-xs uppercase tracking-widest text-muted hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-5 rounded-xl border bg-sand/40 p-6">
          <h2 className="text-3xl">Order summary</h2>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted">
            <span>Shipping</span>
            <span>{remaining === 0 ? "Free" : "Calculated at checkout"}</span>
          </div>
          <p className="text-sm text-gold-dark">
            {remaining === 0
              ? "You qualify for free shipping."
              : `Add ${formatPrice(remaining)} more for free shipping.`}
          </p>
          <Link href="/checkout" className="block">
            <Button size="lg" className="w-full">Checkout</Button>
          </Link>
          <p className="text-xs text-muted">
            You will be asked to sign in. Your bag is saved on this device.
          </p>
          <Link href="/catalog" className="block text-center text-xs uppercase tracking-widest underline-offset-4 hover:underline">
            Continue shopping
          </Link>
        </aside>
      </div>
    </main>
  )
}
