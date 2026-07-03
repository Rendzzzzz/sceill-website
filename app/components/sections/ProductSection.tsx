"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase/client"
import { Card, CardContent } from "../ui/Card"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
}

export function ProductSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(4)
      
      if (!error && data) {
        setProducts(data)
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-light mb-3">Our Collection</h2>
          <p className="text-gray-600">Discover our exquisite range of fragrances</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-64 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Image placeholder</span>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-lg">{product.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                <p className="text-xl font-semibold mt-2">
                  Rp {product.price.toLocaleString('id-ID')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}