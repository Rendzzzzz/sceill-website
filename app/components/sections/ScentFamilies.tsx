import Link from "next/link"

const families = [
  { name: "Floral", note: "Rose, jasmine, peony", tone: "from-[#e8d5cf] to-[#cfae9f]" },
  { name: "Woody", note: "Cedar, vetiver, sandalwood", tone: "from-[#d8c7a8] to-[#9c8057]" },
  { name: "Oriental", note: "Amber, oud, spice", tone: "from-[#3a2e26] to-[#14110f] text-cream" },
  { name: "Fresh", note: "Citrus, neroli, green tea", tone: "from-[#dfe6d3] to-[#b4c29b]" },
]

export function ScentFamilies() {
  return (
    <section className="bg-sand/50 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gold-dark">Find your signature</p>
          <h2 className="text-4xl sm:text-5xl">Shop by scent family</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {families.map((f) => (
            <Link
              key={f.name}
              href={`/catalog?category=${encodeURIComponent(f.name)}`}
              className={`group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-xl bg-gradient-to-b p-6 ${f.tone}`}
            >
              <div className="transition-transform duration-500 group-hover:-translate-y-2">
                <h3 className="text-3xl">{f.name}</h3>
                <p className="mt-1 text-sm opacity-70">{f.note}</p>
                <span className="mt-4 inline-block border-b border-current pb-0.5 text-xs uppercase tracking-[0.2em]">
                  Explore
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
