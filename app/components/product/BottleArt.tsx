import { cn } from "../../lib/utils"

// Stand-in artwork for products that have no photo yet.
export function BottleArt({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-b from-sand to-[#f0e8da]",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 180" className="h-3/5 w-auto drop-shadow-xl">
        <defs>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f7f3ec" stopOpacity="0.95" />
            <stop offset="1" stopColor="#b08d57" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <rect x="46" y="8" width="28" height="22" rx="3" fill="#14110f" />
        <rect x="52" y="30" width="16" height="12" fill="#b08d57" />
        <rect x="18" y="42" width="84" height="130" rx="10" fill="url(#glass)" stroke="#b08d57" strokeWidth="1.5" />
        <rect x="34" y="84" width="52" height="44" fill="#fff" fillOpacity="0.6" stroke="#b08d57" strokeWidth="0.75" />
        <text x="60" y="110" textAnchor="middle" fontSize="9" letterSpacing="2" fill="#14110f" fontFamily="serif">
          SCEILL
        </text>
      </svg>
    </div>
  )
}
