import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"
import { getAdminOrders } from "../../lib/orders"
import { ORDER_STATUSES, STATUS_LABEL, isOrderStatus } from "../../lib/order-status"
import { formatDateTime } from "../../lib/format"
import { formatPrice, cn } from "../../lib/utils"
import { StatusBadge } from "../../components/orders/StatusBadge"

export const metadata: Metadata = {
  title: "Manage orders",
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // proxy.ts already keeps non-admins out; this is the check that really protects the data
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login?callbackUrl=/admin/orders")
  if (session.user.role !== "admin") redirect("/")

  const raw = (await searchParams).status
  const status = isOrderStatus(raw) ? raw : undefined
  const orders = await getAdminOrders(status)

  const chip = (active: boolean) =>
    cn(
      "rounded-lg border px-4 py-2 text-xs uppercase tracking-[0.12em] transition-colors",
      active ? "border-ink bg-ink text-cream" : "border-ink/20 hover:border-ink"
    )

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">Admin</p>
          <h1 className="text-5xl">Orders</h1>
        </div>
        <nav className="flex gap-4 text-xs uppercase tracking-widest" aria-label="Admin sections">
          <Link href="/admin/products" className="underline-offset-4 hover:underline">Products</Link>
          <Link href="/admin/promos" className="underline-offset-4 hover:underline">Promos</Link>
        </nav>
      </div>

      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/orders" className={chip(!status)}>All</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={chip(status === s)}>
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="rounded-xl border bg-white/60 py-16 text-center text-muted">No orders {status ? "with this status" : "yet"}.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white/60">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-sand/40 text-xs uppercase tracking-widest text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-sand/30">
                  <td className="px-5 py-4">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium tracking-wide underline-offset-4 hover:underline">
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-muted">{formatDateTime(o.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    {o.customerName}
                    <p className="text-xs text-muted">{o.customerEmail}</p>
                  </td>
                  <td className="px-5 py-4 text-muted">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td className="px-5 py-4 text-right font-medium tabular-nums">{formatPrice(o.total)}</td>
                  <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
