import type { Metadata } from "next"
import Link from "next/link"
import { Search } from "lucide-react"
import { getCategories, getProducts, type ProductSort } from "../lib/products"
import { ProductCard } from "../components/product/ProductCard"
import { cn } from "../lib/utils"

export const metadata: Metadata = {
  title: "Collection",
  description: "Browse the full SCEILL fragrance collection.",
}

type SearchParams = { [key: string]: string | string[] | undefined }

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A-Z" },
]

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const category = first(params.category)
  const q = first(params.q)?.slice(0, 80)
  const sortParam = first(params.sort)
  const sort = SORTS.some((s) => s.value === sortParam) ? (sortParam as ProductSort) : "newest"

  const [products, categories] = await Promise.all([
    getProducts({ category, q, sort }),
    getCategories(),
  ])

  const chipHref = (cat?: string) => {
    const next = new URLSearchParams()
    if (cat) next.set("category", cat)
    if (q) next.set("q", q)
    if (sort !== "newest") next.set("sort", sort)
    const qs = next.toString()
    return qs ? `/catalog?${qs}` : "/catalog"
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-lg px-5 py-2 text-xs uppercase tracking-[0.15em] border transition-colors",
      active ? "bg-ink text-cream border-ink" : "border-ink/20 hover:border-ink"
    )

  return (
    <main>
      <div className="border-b bg-sand/40">
        <div className="container mx-auto px-4 py-14 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gold-dark">SCEILL</p>
          <h1 className="text-5xl">The collection</h1>
          <p className="mt-3 text-muted">Discover our exquisite range of fragrances</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Scent families" className="flex flex-wrap gap-2">
            <Link href={chipHref()} className={chip(!category)}>All</Link>
            {categories.map((cat) => (
              <Link key={cat} href={chipHref(cat)} className={chip(category === cat)}>
                {cat}
              </Link>
            ))}
          </nav>

          <form action="/catalog" className="flex flex-col gap-2 sm:flex-row">
            {category && <input type="hidden" name="category" value={category} />}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search fragrances"
                aria-label="Search fragrances"
                className="h-11 w-full rounded-lg border border-ink/20 bg-transparent pl-9 pr-3 text-sm placeholder:text-muted focus:border-ink sm:w-64"
              />
            </div>
            <select
              name="sort"
              defaultValue={sort}
              aria-label="Sort by"
              className="h-11 rounded-lg border border-ink/20 bg-transparent px-3 text-sm focus:border-ink"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="h-11 cursor-pointer rounded-lg bg-ink px-6 text-xs uppercase tracking-widest text-cream hover:bg-ink-soft"
            >
              Apply
            </button>
          </form>
        </div>

        <p className="mt-8 text-sm text-muted" aria-live="polite">
          {products.length} {products.length === 1 ? "fragrance" : "fragrances"}
          {category ? ` in ${category}` : ""}
          {q ? ` matching “${q}”` : ""}
        </p>

        {products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-2xl">No fragrances found</p>
            <p className="mt-2 text-muted">Try a different search or scent family.</p>
            <Link href="/catalog" className="mt-6 inline-block border-b border-ink pb-0.5 text-xs uppercase tracking-widest">
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
