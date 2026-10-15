import Link from "next/link"
import { ProductImage } from "./ProductImage"
import { AddToCartButton } from "./AddToCartButton"
import { formatPrice } from "../../lib/utils"
import { productHref } from "../../lib/products"
import type { Product } from "../../types"

export function ProductCard({ product }: { product: Product }) {
  const soldOut = !product.is_available || product.stock <= 0
  const lowStock = !soldOut && product.stock <= 5

  return (
    <article className="group flex flex-col">
      <Link href={productHref(product)} className="block" aria-label={product.name}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand">
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
            <ProductImage src={product.image_url} alt={product.name} />
          </div>
          {soldOut && (
            <span className="absolute left-3 top-3 rounded-md bg-ink px-3 py-1 text-[10px] uppercase tracking-widest text-cream">
              Sold out
            </span>
          )}
          {lowStock && (
            <span className="absolute left-3 top-3 rounded-md bg-gold px-3 py-1 text-[10px] uppercase tracking-widest text-white">
              Only {product.stock} left
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold-dark">{product.category}</p>
        <Link href={productHref(product)}>
          <h3 className="mt-1 text-2xl font-medium leading-tight transition-colors group-hover:text-gold-dark">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</p>
        <p className="mt-3 text-base font-medium tabular-nums">{formatPrice(product.price)}</p>
        <AddToCartButton product={product} className="mt-4" />
      </div>
    </article>
  )
}
