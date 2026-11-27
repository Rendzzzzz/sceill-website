import { describe, expect, it, vi } from "vitest"
import { buildCartQuote, type CartQuoteProduct } from "../cart-quote"

// Fake Test Double: in-memory product catalog replaces database reads.
const fakeCatalog: CartQuoteProduct[] = [
  { id: "rose-1", slug: "rose-eternelle", name: "Rose Éternelle", imageUrl: null, price: 250000, stock: 4, isAvailable: true },
  { id: "oud-2", slug: "oud-noir", name: "Oud Noir", imageUrl: "/oud.jpg", price: 1500000, stock: 8, isAvailable: true },
  { id: "sold-3", slug: "sold-out", name: "Sold Out", imageUrl: null, price: 100000, stock: 0, isAvailable: true },
  { id: "hidden-4", slug: "hidden", name: "Hidden Product", imageUrl: null, price: 100000, stock: 5, isAvailable: false },
]

describe("buildCartQuote", () => {
  // Stub Test Double: controlled shipping response isolates cart totals from shipping rules.
  const stubShippingCalculator = vi.fn((subtotal: number) => subtotal >= 1_500_000 ? 0 : 25_000)

  it("calculates line totals, subtotal, shipping and grand total", () => {
    const result = buildCartQuote([{ productId: "rose-1", quantity: 2 }], fakeCatalog, stubShippingCalculator)
    expect(result.lines[0].lineTotal).toBe(500_000)
    expect(result.subtotal).toBe(500_000)
    expect(result.shippingFee).toBe(25_000)
    expect(result.total).toBe(525_000)
  })

  it("merges duplicate product lines and caps combined quantity at 10", () => {
    const result = buildCartQuote([
      { productId: "rose-1", quantity: 7 },
      { productId: "rose-1", quantity: 6 },
    ], fakeCatalog, stubShippingCalculator)
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0].quantity).toBe(10)
    expect(result.lines[0].lineTotal).toBe(2_500_000)
  })

  it("reports stock shortage while preserving the requested quote line", () => {
    const result = buildCartQuote([{ productId: "rose-1", quantity: 5 }], fakeCatalog, stubShippingCalculator)
    expect(result.issues).toEqual([{ productId: "rose-1", name: "Rose Éternelle", message: "has only 4 left" }])
    expect(result.lines[0].maxQuantity).toBe(4)
  })

  it("reports a product that is no longer available", () => {
    const result = buildCartQuote([{ productId: "hidden-4", quantity: 1 }], fakeCatalog, stubShippingCalculator)
    expect(result.lines).toHaveLength(0)
    expect(result.issues[0].message).toBe("is no longer available")
  })

  it("reports a product with zero stock as sold out", () => {
    const result = buildCartQuote([{ productId: "sold-3", quantity: 1 }], fakeCatalog, stubShippingCalculator)
    expect(result.lines).toHaveLength(0)
    expect(result.issues[0].message).toBe("is sold out")
  })

  it("applies free shipping when subtotal reaches the threshold", () => {
    const result = buildCartQuote([{ productId: "oud-2", quantity: 1 }], fakeCatalog, stubShippingCalculator)
    expect(result.shippingFee).toBe(0)
    expect(result.total).toBe(1_500_000)
  })

  it("does not call the shipping stub when there are no valid quote lines", () => {
    const shipping = vi.fn(() => 25_000)
    const result = buildCartQuote([{ productId: "missing", quantity: 1 }], fakeCatalog, shipping)
    expect(result.shippingFee).toBe(0)
    expect(shipping).not.toHaveBeenCalled()
  })
})
