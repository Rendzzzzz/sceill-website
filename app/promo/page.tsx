"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase/client"
import { Card, CardContent } from "../components/ui/Card"

interface Promo {
  id: string
  title: string
  description: string
  discount_percent: number
  start_date: string
  end_date: string
  is_active: boolean
  image_url: string
}

export default function PromoPage() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPromos()
  }, [])

  const fetchPromos = async () => {
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setPromos(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Promo */}
      <div className="bg-gradient-to-r from-black to-gray-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-light mb-4">Special Promotions</h1>
          <p className="text-xl text-gray-300">Exclusive offers and deals just for you</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {promos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No active promotions at the moment.</p>
            <p className="text-gray-400">Check back soon for exciting offers!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {promos.map((promo) => (
              <Card key={promo.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-64 bg-gray-200">
                  {promo.image_url ? (
                    <img 
                      src={promo.image_url} 
                      alt={promo.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold">
                    -{promo.discount_percent}%
                  </div>
                </div>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-2">{promo.title}</h2>
                  <p className="text-gray-600 mb-4">{promo.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Valid: {new Date(promo.start_date).toLocaleDateString('id-ID')} - {new Date(promo.end_date).toLocaleDateString('id-ID')}</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}