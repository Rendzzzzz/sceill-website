import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { ChevronRight } from "lucide-react"
import { authOptions } from "../../../lib/auth"
import { getAdminOrder } from "../../../lib/orders"
import type { OrderStatus } from "../../../lib/order-status"
import { formatDateTime } from "../../../lib/format"
import { StatusBadge } from "../../../components/orders/StatusBadge"
import { OrderLines, OrderTotals } from "../../../components/orders/OrderLines"
import { OrderStatusActions } from "./OrderStatusActions"

export const metadata: Metadata = {
  title: "Order",
}

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/login?callbackUrl=/admin/orders/${id}`)
  if (session.user.role !== "admin") redirect("/")

  const order = await getAdminOrder(id)
  if (!order) notFound()

  const events: [string, Date | null][] = [
    ["Placed", order.createdAt],
    ["Paid", order.paidAt],
    ["Shipped", order.shippedAt],
    ["Delivered", order.deliveredAt],
    ["Cancelled", order.cancelledAt],
  ]

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted">
        <Link href="/admin/orders" className="hover:text-ink">Orders</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">{order.orderNumber}</span>
      </nav>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} className="mt-2" />
      </header>

      <section className="mt-6 rounded-xl border bg-white/60 p-6" aria-label="Update status">
        <h2 className="mb-4 text-3xl">Update status</h2>
        <OrderStatusActions id={order.id} status={order.status as OrderStatus} trackingNumber={order.trackingNumber ?? ""} />
        {order.status === "pending_payment" && (
          <p className="mt-4 text-xs text-muted">
            Payment window ends {formatDateTime(order.expiresAt)}. After that the order cancels itself.
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-xl border bg-white/60 p-6">
          <h2 className="mb-2 text-3xl">Items</h2>
          <OrderLines items={order.items} linkProducts={false} />
          <OrderTotals subtotal={order.subtotal} shippingFee={order.shippingFee} total={order.total} />
        </section>

        <aside className="h-fit space-y-6">
          <section className="rounded-xl border bg-white/60 p-6">
            <h2 className="mb-2 text-2xl">Customer</h2>
            <p className="text-sm">
              <span className="block font-medium">{order.customerName}</span>
              <a href={`mailto:${order.customerEmail}`} className="block text-muted underline-offset-4 hover:underline">
                {order.customerEmail}
              </a>
              <a href={`tel:${order.customerPhone}`} className="block text-muted underline-offset-4 hover:underline">
                {order.customerPhone}
              </a>
            </p>
          </section>
          <section className="rounded-xl border bg-white/60 p-6">
            <h2 className="mb-2 text-2xl">Ship to</h2>
            <address className="text-sm not-italic leading-relaxed text-muted">
              {order.shipAddress}
              <br />
              {order.shipDistrict}, {order.shipCity}, {order.shipProvince}
              {order.shipPostalCode ? ` ${order.shipPostalCode}` : ""}
            </address>
            {order.trackingNumber && <p className="mt-3 text-sm">Tracking: <span className="font-medium">{order.trackingNumber}</span></p>}
          </section>
          {order.note && (
            <section className="rounded-xl border bg-white/60 p-6">
              <h2 className="mb-2 text-2xl">Customer note</h2>
              <p className="text-sm text-muted">{order.note}</p>
            </section>
          )}
          <section className="rounded-xl border bg-white/60 p-6">
            <h2 className="mb-2 text-2xl">History</h2>
            <ul className="space-y-1 text-sm text-muted">
              {events
                .filter(([, at]) => at)
                .map(([label, at]) => (
                  <li key={label} className="flex justify-between gap-3">
                    <span>{label}</span>
                    <span className="tabular-nums">{formatDateTime(at!)}</span>
                  </li>
                ))}
            </ul>
          </section>
        </aside>
      </div>
    </main>
  )
}
