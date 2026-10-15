// Server-only. How customers pay: manual bank transfer for now.
// Set these in .env.local (and in Vercel) with your real account details.
export const PAYMENT_WINDOW_HOURS = 24

export interface BankDetails {
  bank: string
  accountNumber: string
  accountHolder: string
}

export function getBankDetails(): BankDetails | null {
  const bank = process.env.BANK_NAME?.trim()
  const accountNumber = process.env.BANK_ACCOUNT_NUMBER?.trim()
  const accountHolder = process.env.BANK_ACCOUNT_HOLDER?.trim()
  return bank && accountNumber && accountHolder ? { bank, accountNumber, accountHolder } : null
}
