import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { Check, ChevronRight } from "lucide-react"
import { authOptions } from "../../../lib/auth"
import { getCustomerOrder } from "../../../lib/orders"
import { getBankDetails } from "../../../lib/payment"
import { TIMELINE, STATUS_LABEL, type OrderStatus } from "../../../lib/order-status"
import { formatDateTime } from "../../../lib/format"
import { formatPrice } from "../../../lib/utils"
import { StatusBadge } from "../../../components/orders/StatusBadge"
import { OrderLines, OrderTotals } from "../../../components/orders/OrderLines"
import { CancelOrderButton } from "./CancelOrderButton"

type Props = {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata: Metadata = {
  title: "Order details",
}

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { orderNumber } = await params
  const justPlaced = (await searchParams).placed === "1"

  const session = await getServerSession(authOptions)
  if (!session) redirect(`/login?callbackUrl=/user/orders/${orderNumber}`)

  // looked up by order number AND the signed-in customer, so other people's orders are a 404
  const order = await getCustomerOrder(session.user.id, orderNumber)
  if (!order) notFound()

  const status = order.status as OrderStatus
  const cancelled = status === "cancelled"
  const currentStep = TIMELINE.indexOf(status)
  const bank = getBankDetails()
  const stepTimes: Partial<Record<OrderStatus, Date | null>> = {
    pending_payment: order.createdAt,
    paid: order.paidAt,
    shipped: order.shippedAt,
    delivered: order.deliveredAt,
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted">
        <Link href="/user/orders" className="hover:text-ink">My orders</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">{order.orderNumber}</span>
      </nav>

      {justPlaced && (
        <div className="mt-6 rounded-xl border border-gold/40 bg-gold/10 px-5 py-4" role="status">
          <p className="text-2xl">Thank you, your order is placed.</p>
          <p className="mt-1 text-sm text-muted">Complete the bank transfer below so we can start preparing it.</p>
        </div>
      )}

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">Order</p>
          <h1 className="text-4xl sm:text-5xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} className="mt-2" />
      </header>

      {/* progress */}
      <section className="mt-8 rounded-xl border bg-white/60 p-6" aria-label="Order progress">
        {cancelled ? (
          <p className="text-sm">
            This order was cancelled{order.cancelledAt ? ` on ${formatDateTime(order.cancelledAt)}` : ""}. Any reserved items
            were released.
          </p>
        ) : (
          <ol className="grid grid-cols-5 gap-2">
            {TIMELINE.map((step, i) => {
              const done = i <= currentStep
              const time = stepTimes[step]
              return (
                <li key={step} className="text-center" aria-current={i === currentStep ? "step" : undefined}>
                  <div
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-xs ${
                      done ? "border-ink bg-ink text-cream" : "border-ink/20 text-muted"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <p className={`mt-2 text-[11px] uppercase tracking-wider ${done ? "text-ink" : "text-muted"}`}>
                    {step === "pending_payment" ? "Placed" : STATUS_LABEL[step]}
                  </p>
                  {done && time && <p className="mt-0.5 hidden text-[10px] text-muted sm:block">{formatDateTime(time)}</p>}
                </li>
              )
            })}
          </ol>
        )}
        {status === "shipped" && order.trackingNumber && (
          <p className="mt-5 border-t pt-4 text-sm">
            Tracking number: <span className="font-medium tracking-wide">{order.trackingNumber}</span>
          </p>
        )}
      </section>

      {/* payment instructions */}
      {status === "pending_payment" && (
        <section className="mt-6 rounded-xl border-2 border-ink bg-white p-6 sm:p-8" aria-label="Payment instructions">
          <h2 className="text-3xl">Pay by bank transfer</h2>
          <p className="mt-1 text-sm text-muted">
            Please pay before <span className="font-medium text-ink">{formatDateTime(order.expiresAt)}</span>. Unpaid orders are
            cancelled automatically.
          </p>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted">Amount to transfer</dt>
              <dd className="mt-1 text-3xl font-medium tabular-nums">{formatPrice(order.total)}</dd>
            </div>
            {bank ? (
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted">Transfer to</dt>
                <dd className="mt-1">
                  <span className="block text-lg">{bank.bank}</span>
                  <span className="block text-2xl font-medium tracking-wider tabular-nums">{bank.accountNumber}</span>
                  <span className="block text-muted">a/n {bank.accountHolder}</span>
                </dd>
              </div>
            ) : (
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted">Transfer to</dt>
                <dd className="mt-1 text-muted">Our team will send you the bank details shortly.</dd>
              </div>
            )}
          </dl>
          <p className="mt-5 text-xs text-muted">
            Use the exact amount, and mention {order.orderNumber} in the transfer note. We confirm payments by hand, usually within
            one business day.
          </p>
          <div className="mt-6">
            <CancelOrderButton orderNumber={order.orderNumber} />
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-xl border bg-white/60 p-6">
          <h2 className="mb-2 text-3xl">Items</h2>
          <OrderLines items={order.items} />
          <OrderTotals subtotal={order.subtotal} shippingFee={order.shippingFee} total={order.total} />
        </section>

        <aside className="h-fit space-y-6">
          <section className="rounded-xl border bg-white/60 p-6">
            <h2 className="mb-2 text-2xl">Delivery</h2>
            <address className="text-sm not-italic leading-relaxed text-muted">
              <span className="block font-medium text-ink">{order.customerName}</span>
              {order.shipAddress}
              <br />
              {order.shipDistrict}, {order.shipCity}, {order.shipProvince}
              {order.shipPostalCode ? ` ${order.shipPostalCode}` : ""}
              <br />
              {order.customerPhone}
            </address>
          </section>
          {order.note && (
            <section className="rounded-xl border bg-white/60 p-6">
              <h2 className="mb-2 text-2xl">Your note</h2>
              <p className="text-sm text-muted">{order.note}</p>
            </section>
          )}
        </aside>
      </div>
    </main>
  )
}
