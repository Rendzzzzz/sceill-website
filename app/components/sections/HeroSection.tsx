import Link from "next/link"
import { Button } from "../ui/Button"
import { BottleArt } from "../product/BottleArt"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-ink text-cream">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 75% 40%, rgba(176,141,87,0.35) 0%, rgba(20,17,15,0) 70%)",
        }}
      />
      <div className="container relative mx-auto grid min-h-[min(44rem,calc(100vh-4rem))] items-center gap-10 px-4 py-16 lg:grid-cols-2">
        <div className="animate-fade-up max-w-xl">
          <p className="mb-6 text-xs uppercase tracking-[0.35em] text-gold">Maison de parfum</p>
          <h1 className="text-5xl font-light leading-[1.05] sm:text-6xl lg:text-7xl">
            A room full of <em className="font-normal text-gold">ideas</em>, in a single drop
          </h1>
          <p className="mt-6 max-w-md text-lg text-cream/70">
            Unveil the artistry of perfumery. Rare ingredients, precise composition, and scents made to be remembered.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/catalog">
              <Button variant="gold" size="lg">Shop the collection</Button>
            </Link>
            <Link href="/blog">
              <Button
                variant="outline"
                size="lg"
                className="border-cream/40 text-cream hover:bg-cream hover:text-ink"
              >
                Read the journal
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative hidden h-[28rem] lg:block lg:h-[34rem]">
          <div className="absolute inset-6 rounded-xl border border-gold/40" />
          <BottleArt className="absolute inset-12 rounded-lg bg-gradient-to-b from-ink-soft to-ink" />
        </div>
      </div>
    </section>
  )
}
