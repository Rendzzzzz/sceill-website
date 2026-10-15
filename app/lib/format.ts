// Dates are shown in Jakarta time, whatever the server's own time zone is.
const base = { timeZone: "Asia/Jakarta" } as const

export const formatDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { ...base, day: "numeric", month: "long", year: "numeric" })

export const formatDateTime = (d: Date | string) =>
  new Date(d).toLocaleString("en-GB", {
    ...base,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) + " WIB"
