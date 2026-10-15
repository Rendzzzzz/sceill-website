"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export interface CartItem {
  id: string
  slug: string
  name: string
  price: number
  image_url: string | null
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  // false until the saved bag has been read from the browser
  ready: boolean
  count: number
  subtotal: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  setQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clear: () => void
}

const STORAGE_KEY = "sceill-cart"
const MAX_QUANTITY = 10

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Load after mount so server and client markup match on first render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setItems(JSON.parse(stored))
    } catch {
      // storage unavailable or corrupt: start with an empty cart
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore quota / private mode errors
    }
  }, [items, hydrated])

  const addItem = useCallback<CartContextValue['addItem']>((item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + quantity) }
            : i
        )
      }
      return [...prev, { ...item, quantity: Math.min(MAX_QUANTITY, quantity) }]
    })
    setIsOpen(true)
  }, [])

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(MAX_QUANTITY, quantity) } : i))
    )
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready: hydrated,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      setQuantity,
      removeItem,
      clear: () => setItems([]),
    }),
    [items, hydrated, isOpen, addItem, setQuantity, removeItem]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
