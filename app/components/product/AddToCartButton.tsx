"use client"

import { useState } from "react"
import { Minus, Plus, ShoppingBag } from "lucide-react"
import { useCart } from "../../lib/cart"
import { Button } from "../ui/Button"
import { cn } from "../../lib/utils"
import type { Product } from "../../types"

type CartProduct = Pick<Product, 'id' | 'slug' | 'name' | 'price' | 'image_url' | 'is_available' | 'stock'>

export function AddToCartButton({
  product,
  withQuantity = false,
  className,
}: {
  product: CartProduct
  withQuantity?: boolean
  className?: string
}) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const soldOut = !product.is_available || product.stock <= 0

  const add = () =>
    addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image_url: product.image_url || null,
      },
      quantity
    )

  return (
    <div className={cn("flex gap-3", className)}>
      {withQuantity && !soldOut && (
        <div className="flex h-14 items-center overflow-hidden rounded-lg border border-ink/30">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-full w-11 cursor-pointer items-center justify-center hover:bg-sand/60"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(Math.min(10, product.stock), q + 1))}
            className="flex h-full w-11 cursor-pointer items-center justify-center hover:bg-sand/60"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
      <Button
        type="button"
        size={withQuantity ? "lg" : "default"}
        className="flex-1"
        disabled={soldOut}
        onClick={add}
      >
        <ShoppingBag className="h-4 w-4" />
        {soldOut ? "Sold out" : "Add to bag"}
      </Button>
    </div>
  )
}
