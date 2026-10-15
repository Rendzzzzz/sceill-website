"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Minus, Plus, ShoppingBag, X } from "lucide-react"
import { useCart } from "../../lib/cart"
import { formatPrice } from "../../lib/utils"
import { Button } from "../ui/Button"
import { BottleArt } from "../product/BottleArt"

export function CartDrawer() {
  const { items, count, subtotal, isOpen, closeCart, setQuantity, removeItem } = useCart()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart()
    document.addEventListener("keydown", onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [isOpen, closeCart])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <div className="absolute inset-0 bg-ink/50" onClick={closeCart} />
      <aside className="animate-slide-in-right absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <h2 className="text-2xl">Your bag ({count})</h2>
          <button
            onClick={closeCart}
            className="cursor-pointer p-1 hover:opacity-60"
            aria-label="Close bag"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-gold" />
            <p className="text-lg">Your bag is empty</p>
            <p className="text-sm text-muted">Find a fragrance that tells your story.</p>
            <Link href="/catalog" onClick={closeCart}>
              <Button variant="outline">Explore the collection</Button>
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5">
                  <Link
                    href={`/product/${item.slug || item.id}`}
                    onClick={closeCart}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-sand"
                  >
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <BottleArt className="h-full w-full" />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="text-lg leading-tight">{item.name}</p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="cursor-pointer self-start p-1 text-muted hover:text-ink"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-sm text-muted tabular-nums">{formatPrice(item.price)}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center overflow-hidden rounded-lg border border-ink/30">
                        <button
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center hover:bg-sand/60"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center hover:bg-sand/60"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-4 border-t px-6 py-5">
              <div className="flex items-center justify-between text-lg">
                <span>Subtotal</span>
                <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted">Shipping and taxes are calculated at checkout.</p>
              <Link href="/cart" onClick={closeCart} className="block">
                <Button size="lg" className="w-full">View bag &amp; checkout</Button>
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
