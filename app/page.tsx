// app/page.tsx
import { HeroSection } from './components/sections/HeroSection'
import { ProductSection } from './components/sections/ProductSection'
import { ScentFamilies } from './components/sections/ScentFamilies'
import { AboutSection } from './components/sections/AboutSection'
import { NewsletterSection } from './components/sections/NewsletterSection'

// products come from the database; refresh the static page every minute
export const revalidate = 60

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ProductSection />
      <ScentFamilies />
      <AboutSection />
      <NewsletterSection />
    </main>
  )
}
