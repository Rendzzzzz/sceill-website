"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase/client"
import { Card, CardContent } from "../components/ui/Card"
import Link from "next/link"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  stock: number
  is_available: boolean
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase.from('products').select('*')
    
    if (selectedCategory !== "all") {
      query = query.eq('category', selectedCategory)
    }
    
    const { data, error } = await query
    if (!error && data) {
      setProducts(data)
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(p => p.category))] as string[]
      setCategories(uniqueCategories)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-light">Our Collection</h1>
          <p className="text-gray-600 mt-2">Discover our exquisite range of fragrances</p>
        </div>
      </div>

      {/* Filter Categories */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              selectedCategory === "all" 
                ? "bg-black text-white" 
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedCategory === cat 
                  ? "bg-black text-white" 
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="relative h-64 bg-gray-200">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  {!product.is_available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold px-4 py-2 bg-red-600 rounded">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{product.name}</h3>
                      <p className="text-gray-500 text-sm">{product.category}</p>
                    </div>
                    <span className="text-xl font-semibold">
                      Rp {product.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {product.description}
                  </p>
                  <button className="w-full mt-4 bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors">
                    Add to Cart
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}