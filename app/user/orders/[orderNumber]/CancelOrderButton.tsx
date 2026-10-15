"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/Button"

export function CancelOrderButton({ orderNumber }: { orderNumber: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancel = async () => {
    if (!confirm("Cancel this order? The items will be released.")) return
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/orders/${orderNumber}/cancel`, { method: "POST" }).catch(() => null)
    if (res?.ok) {
      router.refresh()
    } else {
      const data = await res?.json().catch(() => ({}))
      setError(data?.error ?? "Could not cancel the order. Please try again.")
    }
    setBusy(false)
  }

  return (
    <div>
      <Button type="button" variant="outline" onClick={cancel} disabled={busy}>
        {busy ? "Cancelling..." : "Cancel order"}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
