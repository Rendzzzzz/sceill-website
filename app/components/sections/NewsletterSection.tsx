"use client"

import { useState } from "react"
// Ubah import supabase ke relative path
import { supabase } from "../../lib/supabase/client"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email })

      if (error) throw error
      setStatus("success")
      setEmail("")
    } catch {
      setStatus("error")
    }
  }

  return (
    <section className="py-20 bg-black text-white">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <h2 className="text-3xl font-light mb-3">Enjoy SCEILL Exclusive Offers</h2>
        <p className="text-gray-400 mb-8">
          Stay up-to-date with our latest news, updates and promotions
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
          <Button type="submit" className="bg-white text-black hover:bg-white/90">
            Subscribe
          </Button>
        </form>

        {status === "success" && (
          <p className="text-green-400 mt-4">Thank you for subscribing!</p>
        )}
        {status === "error" && (
          <p className="text-red-400 mt-4">Something went wrong. Please try again.</p>
        )}
      </div>
    </section>
  )
}