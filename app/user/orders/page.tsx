import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { Package } from "lucide-react"
import { authOptions } from "../../lib/auth"
import { getCustomerOrders } from "../../lib/orders"
import { formatDate } from "../../lib/format"
import { formatPrice } from "../../lib/utils"
import { StatusBadge } from "../../components/orders/StatusBadge"
import { Button } from "../../components/ui/Button"

export const metadata: Metadata = {
  title: "My orders",
}

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login?callbackUrl=/user/orders")

  const orders = await getCustomerOrders(session.user.id)

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">My account</p>
      <h1 className="mt-1 text-5xl">My orders</h1>

      {orders.length === 0 ? (
        <div className="mt-16 text-center">
          <Package className="mx-auto h-12 w-12 text-gold" strokeWidth={1.25} />
          <p className="mt-6 text-2xl">No orders yet</p>
          <p className="mt-2 text-muted">When you place an order, you can follow it here.</p>
          <Link href="/catalog" className="mt-8 inline-block">
            <Button size="lg">Explore the collection</Button>
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-4">
          {orders.map((order) => {
            const units = order.items.reduce((n, i) => n + i.quantity, 0)
            return (
              <li key={order.id}>
                <Link
                  href={`/user/orders/${order.orderNumber}`}
                  className="block rounded-xl border bg-white/60 p-5 transition-colors hover:border-ink sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium tracking-wide">{order.orderNumber}</p>
                      <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm text-muted">
                    {order.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
                    <span className="text-muted">
                      {units} {units === 1 ? "item" : "items"}
                    </span>
                    <span className="text-lg font-medium tabular-nums">{formatPrice(order.total)}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
