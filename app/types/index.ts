import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
}

export interface Customer {
  id: string
  email: string
  name: string
  phone?: string
  address?: string
  city?: string
  province?: string
  postal_code?: string
  country?: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  category: string
  image_url: string
  stock: number
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  order_number: string
  total_amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_method: string
  shipping_address: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  created_at: string
}