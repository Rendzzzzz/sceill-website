import Link from "next/link"
import { Truck, ShieldCheck, Gift, RefreshCcw } from "lucide-react"

const perks = [
  { icon: Truck, title: "Free shipping", text: "On orders over Rp 1.500.000" },
  { icon: ShieldCheck, title: "100% authentic", text: "Genuine fragrances, guaranteed" },
  { icon: Gift, title: "Complimentary samples", text: "With every order" },
  { icon: RefreshCcw, title: "Easy returns", text: "7-day return on unopened items" },
]

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="border-b border-white/10">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-10 lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-6 w-6 shrink-0 text-gold" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-cream/60">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <h3 className="font-display text-3xl tracking-[0.3em]">SCEILL</h3>
            <p className="mt-4 max-w-xs text-sm text-cream/60">
              Fragrance is an art fused with science. Crafted to make you adored, loved and remembered.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-gold">Shop</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><Link href="/catalog" className="hover:text-cream">All fragrances</Link></li>
              <li><Link href="/catalog?category=Floral" className="hover:text-cream">Floral</Link></li>
              <li><Link href="/catalog?category=Woody" className="hover:text-cream">Woody</Link></li>
              <li><Link href="/promo" className="hover:text-cream">Promotions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-gold">Discover</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><Link href="/blog" className="hover:text-cream">Journal</Link></li>
              <li><Link href="/cart" className="hover:text-cream">Your bag</Link></li>
              <li><Link href="/login" className="hover:text-cream">Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-gold">Connect</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><a href="#" className="hover:text-cream">Instagram</a></li>
              <li><a href="#" className="hover:text-cream">TikTok</a></li>
              <li><a href="#" className="hover:text-cream">YouTube</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-cream/50">
          <p>&copy; 2026 SCEILL. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
