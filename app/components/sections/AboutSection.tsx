import { Palette, FlaskConical, Heart } from "lucide-react"

const pillars = [
  { icon: Palette, title: "Artistry", text: "Every fragrance is composed by hand, with creative passion and rare ingredients." },
  { icon: FlaskConical, title: "Science", text: "Precision in every drop: balanced notes, lasting sillage, tested for performance." },
  { icon: Heart, title: "Memory", text: "Scents designed to linger, so you are adored, loved and remembered." },
]

export function AboutSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gold-dark">Our philosophy</p>
          <h2 className="text-4xl sm:text-5xl">Fragrance is an art fused with science</h2>
          <p className="mt-6 text-lg text-muted">
            At SCEILL, we believe each fragrance is there to make you adored, loved and remembered.
          </p>
        </div>
        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text }) => (
            <div key={title} className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-gold/50 text-gold-dark">
                <Icon className="h-7 w-7" strokeWidth={1.25} />
              </div>
              <h3 className="mb-2 text-2xl">{title}</h3>
              <p className="mx-auto max-w-xs text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
