import { STATUS_LABEL, STATUS_TONE, isOrderStatus } from "../../lib/order-status"
import { cn } from "../../lib/utils"

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const known = isOrderStatus(status)
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest",
        known ? STATUS_TONE[status] : "bg-stone-200 text-stone-700",
        className
      )}
    >
      {known ? STATUS_LABEL[status] : status}
    </span>
  )
}
