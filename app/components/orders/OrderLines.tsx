import Link from "next/link"
import { BottleArt } from "../product/BottleArt"
import { formatPrice } from "../../lib/utils"
import type { OrderItemRow } from "../../lib/orders"

export function OrderLines({ items, linkProducts = true }: { items: OrderItemRow[]; linkProducts?: boolean }) {
  return (
    <ul className="divide-y">
      {items.map((item) => {
        const thumb = (
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-sand">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <BottleArt className="h-full w-full" />
            )}
          </div>
        )
        const canLink = linkProducts && item.productId && item.productSlug
        return (
          <li key={item.id} className="flex gap-4 py-4">
            {canLink ? <Link href={`/product/${item.productSlug}`}>{thumb}</Link> : thumb}
            <div className="flex flex-1 flex-col justify-between sm:flex-row sm:items-start">
              <div>
                <p className="text-xl leading-tight">{item.productName}</p>
                <p className="mt-1 text-sm text-muted tabular-nums">
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <p className="font-medium tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function OrderTotals({ subtotal, shippingFee, total }: { subtotal: number; shippingFee: number; total: number }) {
  return (
    <dl className="space-y-2 border-t pt-4 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">Shipping</dt>
        <dd className="tabular-nums">{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</dd>
      </div>
      <div className="flex justify-between border-t pt-3 text-lg">
        <dt>Total</dt>
        <dd className="font-medium tabular-nums">{formatPrice(total)}</dd>
      </div>
    </dl>
  )
}
