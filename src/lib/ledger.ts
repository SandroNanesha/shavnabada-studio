import type { Enrollment, Payment, PaymentClassification, LedgerMonth, MonthOverrideStatus } from '@/types'

// Generate YYYY-MM strings from startDate to endDate (or today = 2026-09)
export function generateMonths(startDate: string, endDate: string | null): string[] {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const start = startDate.slice(0, 7) // YYYY-MM
  const end = endDate ? endDate.slice(0, 7) : today

  const months: string[] = []
  let [year, month] = start.split('-').map(Number)
  const [endYear, endMonth] = end.split('-').map(Number)

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`)
    month++
    if (month > 12) {
      month = 1
      year++
    }
  }

  return months
}

// Compute effective monthly fee for an enrollment
export function effectiveFee(enrollment: Enrollment, classifications: PaymentClassification[]): number {
  const base = enrollment.baseFee * (1 - enrollment.discount / 100)

  if (!enrollment.classificationId) return base

  const cls = classifications.find(c => c.id === enrollment.classificationId)
  if (!cls) return base

  switch (cls.type) {
    case 'standard':
      return cls.value
    case 'percent':
      return Math.round(base * (1 - cls.value / 100))
    case 'amount':
      return Math.max(0, base - cls.value)
    case 'fixed':
      return cls.value
    default:
      return base
  }
}

// Derive month status from due/paid amounts
export function deriveStatus(due: number, paid: number): MonthOverrideStatus {
  if (paid >= due) return 'paid'
  if (paid > 0) return 'partial'
  return 'unpaid'
}

// Oldest-unpaid-first allocation: compute per-month ledger for one enrollment
export function computeLedger(
  enrollment: Enrollment,
  allPayments: Payment[],
  classifications: PaymentClassification[]
): LedgerMonth[] {
  const months = generateMonths(enrollment.startDate, enrollment.endDate)
  const fee = effectiveFee(enrollment, classifications)

  // Filter and sort payments for this enrollment by date ascending
  const payments = allPayments
    .filter(p => p.enrollmentId === enrollment.id)
    .sort((a, b) => a.date.localeCompare(b.date))

  // Total paid pool
  let remainingFunds = payments.reduce((sum, p) => sum + p.amount, 0)

  const ledger: LedgerMonth[] = []

  for (const month of months) {
    const due = enrollment.monthDueOverrides?.[month] ?? fee
    const allocated = Math.min(remainingFunds, due)
    remainingFunds = Math.max(0, remainingFunds - due)

    const override = enrollment.monthOverrides[month]
    const paidAmountOverride = enrollment.monthPaidAmountOverrides?.[month]
    const displayPaid = paidAmountOverride !== undefined ? paidAmountOverride : allocated
    const computedStatus = deriveStatus(due, displayPaid)
    const status = override ?? computedStatus

    ledger.push({
      month,
      due,
      paid: displayPaid,
      status,
      isOverride: !!override,
    })
  }

  return ledger
}

// Given multiple enrollments' ledger months, return highest-priority status for display
// Priority: unpaid > confusion > partial > exempt > paid
export function combinedMonthStatus(statuses: MonthOverrideStatus[]): MonthOverrideStatus | null {
  if (statuses.length === 0) return null

  const priority: MonthOverrideStatus[] = ['unpaid', 'confusion', 'partial', 'exempt', 'paid']

  for (const p of priority) {
    if (statuses.includes(p)) return p
  }

  return statuses[0]
}
