'use client'

import type { MonthOverrideStatus } from '@/types'

interface MonthCellProps {
  status: MonthOverrideStatus | null
  due: number
  paid: number
  isOverride: boolean
  onClick?: () => void
}

const STATUS_STYLES: Record<MonthOverrideStatus, { bg: string; text: string }> = {
  paid: { bg: '#c6efce', text: '#276221' },
  partial: { bg: '#ffeb9c', text: '#9c6500' },
  unpaid: { bg: '#ffc7ce', text: '#9c0006' },
  confusion: { bg: '#ffcc99', text: '#7f4700' },
  exempt: { bg: '#deebf7', text: '#2f5496' },
}

const MANUAL_PAID = { bg: '#dbeafe', text: '#1d4ed8' }

function cellContent(status: MonthOverrideStatus, due: number, paid: number): string {
  switch (status) {
    case 'paid':
      return '✓'
    case 'partial':
      return `${paid}/${due}`
    case 'unpaid':
      return `-${due}`
    case 'confusion':
      return '?'
    case 'exempt':
      return '—'
    default:
      return ''
  }
}

export default function MonthCell({ status, due, paid, isOverride, onClick }: MonthCellProps) {
  if (status === null) {
    return (
      <td
        style={{
          width: 72, minWidth: 72, maxWidth: 72,
          backgroundColor: '#fff', border: '1px solid #d0d7de',
          padding: '2px', textAlign: 'center', verticalAlign: 'middle',
          position: 'relative', cursor: onClick ? 'pointer' : 'default',
        }}
        onClick={onClick ? e => { e.stopPropagation(); onClick() } : undefined}
      />
    )
  }

  const { bg, text } = (status === 'paid' && isOverride) ? MANUAL_PAID : STATUS_STYLES[status]
  const content = cellContent(status, due, paid)

  return (
    <td
      title={`Paid: ${paid} / Due: ${due}`}
      onClick={onClick ? e => { e.stopPropagation(); onClick() } : undefined}
      style={{
        width: 72,
        minWidth: 72,
        maxWidth: 72,
        backgroundColor: bg,
        color: text,
        border: '1px solid #d0d7de',
        padding: '2px',
        textAlign: 'center',
        verticalAlign: 'middle',
        position: 'relative',
        fontSize: 11,
        fontFamily: 'var(--font-geist-mono), monospace',
        fontWeight: status === 'paid' ? 600 : 500,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {content}
      {isOverride && (
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: '#6b7280',
            display: 'block',
          }}
        />
      )}
    </td>
  )
}
