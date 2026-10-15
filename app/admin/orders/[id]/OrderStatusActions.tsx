"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/Button"
import { ADMIN_TRANSITIONS, type OrderStatus } from "../../../lib/order-status"
import { inputClass } from "../../../components/auth/AuthShell"

const ACTION_LABEL: Record<OrderStatus, string> = {
  pending_payment: "",
  paid: "Mark as paid",
  processing: "Start preparing",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
  cancelled: "Cancel order",
}

export function OrderStatusActions({
  id,
  status,
  trackingNumber,
}: {
  id: string
  status: OrderStatus
  trackingNumber: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<OrderStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tracking, setTracking] = useState(trackingNumber)
  const next = ADMIN_TRANSITIONS[status]

  const move = async (to: OrderStatus) => {
    if (to === "cancelled" && !confirm("Cancel this order? Its items go back into stock.")) return
    setBusy(to)
    setError(null)
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to, ...(to === "shipped" && { trackingNumber: tracking }) }),
    }).catch(() => null)
    if (res?.ok) router.refresh()
    else setError((await res?.json().catch(() => ({})))?.error ?? "Could not update the order.")
    setBusy(null)
  }

  if (next.length === 0) {
    return <p className="text-sm text-muted">This order is {status === "cancelled" ? "cancelled" : "complete"}. No further changes.</p>
  }

  return (
    <div className="space-y-4">
      {next.includes("shipped") && (
        <div className="max-w-sm">
          <label htmlFor="tracking" className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-muted">
            Tracking number
          </label>
          <input
            id="tracking"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. JNE1234567890"
            maxLength={100}
            className={inputClass}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {next.map((to) => (
          <Button
            key={to}
            type="button"
            variant={to === "cancelled" ? "outline" : "default"}
            disabled={busy !== null}
            onClick={() => move(to)}
          >
            {busy === to ? "Saving..." : ACTION_LABEL[to]}
          </Button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
