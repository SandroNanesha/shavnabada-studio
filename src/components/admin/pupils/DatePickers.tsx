'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/context'
import { translations } from '@/lib/i18n/translations'

const sel: React.CSSProperties = {
  padding: '5px 6px', fontSize: 12, border: '1px solid #d0d7de',
  borderRadius: 4, outline: 'none', backgroundColor: '#fff',
  color: '#1f2937', cursor: 'pointer', boxSizing: 'border-box',
}

function useMonthNames() {
  const { lang } = useLanguage()
  const tr = translations[lang as keyof typeof translations] as Record<string, unknown>
  const long = (tr?.months as { long: string[] })?.long ??
    ['January','February','March','April','May','June','July','August','September','October','November','December']
  return long
}

// ── Full date picker (birth date): YYYY-MM-DD ─────────────────────────────────
interface DatePickerProps {
  value: string          // YYYY-MM-DD or ''
  onChange: (v: string) => void
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const monthNames = useMonthNames()
  const now = new Date()

  const parse = (v: string) => {
    const p = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    return p ? { y: parseInt(p[1], 10), m: parseInt(p[2], 10), d: parseInt(p[3], 10) } : { y: 0, m: 0, d: 0 }
  }

  const { y: initY, m: initM, d: initD } = parse(value)
  const [year,  setYear]  = useState(initY)
  const [month, setMonth] = useState(initM)
  const [day,   setDay]   = useState(initD)

  // Sync internal state if the external value changes (e.g. form reset)
  useEffect(() => {
    const { y, m, d } = parse(value)
    setYear(y); setMonth(m); setDay(d)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const emit = (y: number, m: number, d: number) => {
    if (y && m && d) {
      onChange(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    } else {
      onChange('')
    }
  }

  const handleYear = (y: number) => { setYear(y); emit(y, month, day) }
  const handleMonth = (m: number) => {
    // Clamp day if new month has fewer days
    const maxDay = m ? new Date(year || 2000, m, 0).getDate() : 31
    const clampedDay = day > maxDay ? 0 : day
    if (clampedDay !== day) setDay(clampedDay)
    setMonth(m)
    emit(year, m, clampedDay)
  }
  const handleDay = (d: number) => { setDay(d); emit(year, month, d) }

  const daysInMonth = month ? new Date(year || 2000, month, 0).getDate() : 31

  const years: number[] = []
  for (let y = now.getFullYear(); y >= 1940; y--) years.push(y)

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <select
        value={year || ''}
        onChange={e => handleYear(Number(e.target.value))}
        style={{ ...sel, flex: '0 0 72px' }}
      >
        <option value="">—</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select
        value={month || ''}
        onChange={e => handleMonth(Number(e.target.value))}
        style={{ ...sel, flex: 1 }}
      >
        <option value="">—</option>
        {monthNames.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
      </select>
      <select
        value={day || ''}
        onChange={e => handleDay(Number(e.target.value))}
        style={{ ...sel, flex: '0 0 52px' }}
      >
        <option value="">—</option>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d =>
          <option key={d} value={d}>{d}</option>
        )}
      </select>
    </div>
  )
}

// ── Month picker (start month): YYYY-MM-DD with day always 01 ─────────────────
interface MonthPickerProps {
  value: string          // YYYY-MM-DD — day portion ignored/set to 01
  onChange: (v: string) => void
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const monthNames = useMonthNames()
  const now = new Date()

  const parts = value.match(/^(\d{4})-(\d{2})/)
  const year  = parts ? parseInt(parts[1], 10) : now.getFullYear()
  const month = parts ? parseInt(parts[2], 10) : now.getMonth() + 1

  const emit = (y: number, m: number) =>
    onChange(`${y}-${String(m).padStart(2, '0')}-01`)

  const years: number[] = []
  for (let y = 2020; y <= now.getFullYear() + 1; y++) years.push(y)

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <select
        value={year}
        onChange={e => emit(Number(e.target.value), month)}
        style={{ ...sel, flex: '0 0 72px' }}
      >
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select
        value={month}
        onChange={e => emit(year, Number(e.target.value))}
        style={{ ...sel, flex: 1 }}
      >
        {monthNames.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
      </select>
    </div>
  )
}
