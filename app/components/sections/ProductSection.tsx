import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getProducts } from "../../lib/products"
import { ProductCard } from "../product/ProductCard"

export async function ProductSection() {
  const products = await getProducts({ limit: 4 })

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gold-dark">New arrivals</p>
            <h2 className="text-4xl sm:text-5xl">The collection</h2>
          </div>
          <Link
            href="/catalog"
            className="group flex items-center gap-2 text-xs uppercase tracking-[0.2em] hover:text-gold-dark"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="py-12 text-center text-muted">New fragrances are on their way.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
