// app/page.tsx
import { HeroSection } from './components/sections/HeroSection'
import { ProductSection } from './components/sections/ProductSection'
import { AboutSection } from './components/sections/AboutSection'
import { NewsletterSection } from './components/sections/NewsletterSection'

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ProductSection />
      <AboutSection />
      <NewsletterSection />
    </main>
  )
}