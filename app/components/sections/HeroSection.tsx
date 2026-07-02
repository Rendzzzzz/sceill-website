"use client"

import { Button } from "../ui/Button"

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center bg-gradient-to-r from-gray-900 to-gray-700">
      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl text-white">
          <h1 className="text-6xl md:text-7xl font-light mb-6 tracking-wider">
            SCEILL
            <span className="block text-3xl md:text-4xl font-thin mt-2">
              A Room Full of Ideas
            </span>
          </h1>
          <p className="text-xl md:text-2xl font-light mb-8 opacity-90">
            Unveil the artistry of perfumery through insightful articles,
            expert advice, and trend updates.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-white text-black hover:bg-white/90">
              Shop Collection
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Read Our Article
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}