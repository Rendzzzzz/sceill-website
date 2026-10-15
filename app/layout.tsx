// app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { CartDrawer } from './components/cart/CartDrawer'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
})

export const metadata: Metadata = {
  title: {
    default: 'SCEILL - Luxury Fragrance',
    template: '%s | SCEILL',
  },
  description:
    'Unveil the artistry of perfumery with SCEILL. Luxury fragrances crafted to be adored, loved and remembered.',
  openGraph: {
    title: 'SCEILL - Luxury Fragrance',
    description: 'Fragrance is an art fused with science.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        <Providers>
          <Header />
          <div className="pt-16 min-h-screen">{children}</div>
          <Footer />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  )
}
