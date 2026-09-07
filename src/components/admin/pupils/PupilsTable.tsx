'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Pupil, Group, PaymentClassification, Payment, LedgerMonth } from '@/types'
import { computeLedger, combinedMonthStatus, generateMonths } from '@/lib/ledger'
import { useLanguage } from '@/lib/i18n/context'
import MonthCell from './MonthCell'

interface PupilsTableProps {
  pupils: Pupil[]
  groups: Group[]
  classifications: PaymentClassification[]
  payments: Payment[]
  fromMonth: string
  toMonth: string
  groupFilter: string
  onGroupFilterChange: (groupId: string) => void
  onCellClick: (pupil: Pupil, month: string) => void
}


// Column widths
const COL_NUM = 32
const COL_FIRST = 110
const COL_LAST = 110
const COL_GROUP = 130

const STICKY_BORDER = '1px solid #d0d7de'
const HEADER_BG = '#f6f8fa'
const STICKY_BG = '#f6f8fa'

function formatMonthLabel(month: string, prevMonth: string | null, shortMonths: string[]): string {
  const [year, m] = month.split('-').map(Number)
  const monthName = shortMonths[m - 1]
  // Show year if first column or year changes
  if (!prevMonth || prevMonth.split('-')[0] !== String(year)) {
    return `${monthName} '${String(year).slice(2)}`
  }
  return monthName
}

export default function PupilsTable({
  pupils,
  groups,
  classifications,
  payments,
  fromMonth,
  toMonth,
  groupFilter,
  onGroupFilterChange,
  onCellClick,
}: PupilsTableProps) {
  const { t, lang } = useLanguage()
  const router = useRouter()

  const months = useMemo(() => generateMonths(fromMonth, toMonth), [fromMonth, toMonth])

  // precompute all ledgers
  const ledgerMap = useMemo(() => {
    const map = new Map<string, Map<string, LedgerMonth>>() // pupilId -> month -> LedgerMonth
    for (const pupil of pupils) {
      const monthMap = new Map<string, LedgerMonth>()
      for (const enrollment of pupil.enrollments) {
        const ledger = computeLedger(enrollment, payments, classifications)
        for (const lm of ledger) {
          // If two enrollments overlap in a month, take the one with "worse" status
          const existing = monthMap.get(lm.month)
          if (!existing) {
            monthMap.set(lm.month, lm)
          } else {
            const combined = combinedMonthStatus([existing.status, lm.status])
            if (combined) {
              monthMap.set(lm.month, {
                month: lm.month,
                due: existing.due + lm.due,
                paid: existing.paid + lm.paid,
                status: combined,
                isOverride: existing.isOverride || lm.isOverride,
              })
            }
          }
        }
      }
      map.set(pupil.id, monthMap)
    }
    return map
  }, [pupils, payments, classifications])

  const shortMonths = (lang === 'ka'
    ? ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])

  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const groupMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const g of groups) m.set(g.id, g.name)
    return m
  }, [groups])

  // Left offsets for sticky columns
  const LEFT_NUM = 0
  const LEFT_FIRST = COL_NUM
  const LEFT_LAST = COL_NUM + COL_FIRST
  const LEFT_GROUP = COL_NUM + COL_FIRST + COL_LAST

  const stickyTh = (left: number, width: number, isLast = false) => ({
    position: 'sticky' as const,
    left: left,
    zIndex: 2,
    backgroundColor: HEADER_BG,
    width: width,
    minWidth: width,
    maxWidth: width,
    border: STICKY_BORDER,
    padding: '4px 6px',
    fontWeight: 600,
    fontSize: 11,
    color: '#374151',
    whiteSpace: 'nowrap' as const,
    boxShadow: isLast ? '2px 0 4px rgba(0,0,0,0.08)' : undefined,
  })

  const stickyTd = (left: number, width: number, isLast = false, isHovered = false) => ({
    position: 'sticky' as const,
    left: left,
    zIndex: 1,
    backgroundColor: isHovered ? '#eef2f7' : STICKY_BG,
    width: width,
    minWidth: width,
    maxWidth: width,
    border: STICKY_BORDER,
    padding: '3px 6px',
    fontSize: 11,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    boxShadow: isLast ? '2px 0 4px rgba(0,0,0,0.08)' : undefined,
  })

  if (pupils.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        {t('pupils.no_data')}
      </div>
    )
  }

  const scrollContainerStyle = { overflow: 'auto', height: '100%', width: '100%', WebkitOverflowScrolling: 'touch' } as React.CSSProperties

  return (
    <div style={scrollContainerStyle}>
      <table
        style={{
          borderCollapse: 'collapse',
          minWidth: 'max-content',
          fontSize: 11,
          backgroundColor: '#fff',
        }}
      >
        <thead>
          <tr style={{ top: 0, position: 'sticky', zIndex: 3 }}>
            <th style={{ ...stickyTh(LEFT_NUM, COL_NUM), textAlign: 'center' }}>{t('table.num')}</th>
            <th style={stickyTh(LEFT_FIRST, COL_FIRST)}>{t('table.first_name')}</th>
            <th style={stickyTh(LEFT_LAST, COL_LAST)}>{t('table.last_name')}</th>
            <th style={{ ...stickyTh(LEFT_GROUP, COL_GROUP, true), padding: 0 }}>
              <select
                value={groupFilter}
                onChange={e => onGroupFilterChange(e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: '4px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: groupFilter ? '#1d4ed8' : '#374151',
                  backgroundColor: groupFilter ? '#eff6ff' : HEADER_BG,
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'auto',
                }}
              >
                <option value="">{t('table.group_filter_placeholder')}</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </th>
            {months.map((month, i) => {
              const prev = i > 0 ? months[i - 1] : null
              return (
                <th
                  key={month}
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    backgroundColor: HEADER_BG,
                    width: 72,
                    minWidth: 72,
                    maxWidth: 72,
                    border: STICKY_BORDER,
                    padding: '4px 2px',
                    fontWeight: 600,
                    fontSize: 10,
                    color: '#374151',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatMonthLabel(month, prev, shortMonths)}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {pupils.map((pupil, rowIdx) => {
            const primaryGroup = pupil.enrollments[0]?.groupId
            const groupName = primaryGroup ? (groupMap.get(primaryGroup) ?? '—') : '—'
            const pupilLedger = ledgerMap.get(pupil.id)

            const isHovered = hoveredRow === pupil.id

            return (
              <tr
                key={pupil.id}
                onClick={() => router.push(`/pupils/${pupil.id}`)}
                onMouseEnter={() => setHoveredRow(pupil.id)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* # */}
                <td style={{ ...stickyTd(LEFT_NUM, COL_NUM, false, isHovered), textAlign: 'center', color: '#9ca3af' }}>
                  {rowIdx + 1}
                </td>
                {/* First name */}
                <td style={{ ...stickyTd(LEFT_FIRST, COL_FIRST, false, isHovered), fontWeight: 500, color: '#1f2937' }}>
                  {pupil.firstName}
                </td>
                {/* Surname */}
                <td style={stickyTd(LEFT_LAST, COL_LAST, false, isHovered)}>
                  {pupil.surname}
                </td>
                {/* Group */}
                <td style={stickyTd(LEFT_GROUP, COL_GROUP, true, isHovered)}>
                  {groupName}
                </td>
                {/* Month cells */}
                {months.map(month => {
                  const lm = pupilLedger?.get(month)
                  if (!lm) {
                    return <MonthCell key={month} status={null} due={0} paid={0} isOverride={false} onClick={() => onCellClick(pupil, month)} />
                  }
                  return (
                    <MonthCell
                      key={month}
                      status={lm.status}
                      due={lm.due}
                      paid={lm.paid}
                      isOverride={lm.isOverride}
                      onClick={() => onCellClick(pupil, month)}
                    />
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
