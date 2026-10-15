import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, Truck, ShieldCheck } from "lucide-react"
import { getProduct, getRelatedProducts } from "../../lib/products"
import { formatPrice } from "../../lib/utils"
import { ProductImage } from "../../components/product/ProductImage"
import { AddToCartButton } from "../../components/product/AddToCartButton"
import { ProductCard } from "../../components/product/ProductCard"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: "Fragrance not found" }
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      images: product.image_url ? [product.image_url] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product)
  const soldOut = !product.is_available || product.stock <= 0

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image_url || undefined,
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "IDR",
      price: product.price,
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  }

  return (
    <main>
      <script
        type="application/ld+json"
        // "<" is escaped so product text cannot close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="container mx-auto px-4 py-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted">
          <Link href="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/catalog" className="hover:text-ink">Collection</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink">{product.name}</span>
        </nav>
      </div>

      <div className="container mx-auto grid gap-10 px-4 pb-20 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>

        <div className="flex flex-col justify-center lg:py-8">
          <Link
            href={`/catalog?category=${encodeURIComponent(product.category)}`}
            className="text-xs uppercase tracking-[0.3em] text-gold-dark hover:underline"
          >
            {product.category}
          </Link>
          <h1 className="mt-3 text-5xl leading-tight lg:text-6xl">{product.name}</h1>
          <p className="mt-4 text-2xl tabular-nums">{formatPrice(product.price)}</p>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">{product.description}</p>

          <div className="mt-8 max-w-md">
            <AddToCartButton product={product} withQuantity />
            <p className="mt-3 text-sm text-muted" aria-live="polite">
              {soldOut
                ? "Currently unavailable"
                : product.stock <= 5
                  ? `Only ${product.stock} left in stock`
                  : "In stock, ready to ship"}
            </p>
          </div>

          <ul className="mt-10 max-w-md space-y-4 border-t pt-8 text-sm">
            <li className="flex items-start gap-3">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} />
              <span>Free shipping on orders over Rp 1.500.000, with complimentary samples.</span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} />
              <span>100% authentic. 7-day returns on unopened items.</span>
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t bg-sand/40 py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-10 text-center text-4xl">You may also love</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
