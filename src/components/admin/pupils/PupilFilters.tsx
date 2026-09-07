'use client'

import { useState, useEffect } from 'react'
import type { MonthOverrideStatus } from '@/types'
import { useLanguage } from '@/lib/i18n/context'
import { translations } from '@/lib/i18n/translations'

const STATUS_OPTIONS: { value: MonthOverrideStatus; bg: string; text: string }[] = [
  { value: 'paid', bg: '#c6efce', text: '#276221' },
  { value: 'partial', bg: '#ffeb9c', text: '#9c6500' },
  { value: 'unpaid', bg: '#ffc7ce', text: '#9c0006' },
  { value: 'confusion', bg: '#ffcc99', text: '#7f4700' },
  { value: 'exempt', bg: '#deebf7', text: '#2f5496' },
]

const SELECT_STYLE: React.CSSProperties = {
  fontSize: 12, padding: '2px 4px', border: '1px solid #d0d7de',
  borderRadius: 4, outline: 'none', backgroundColor: '#fff', color: '#1f2937', cursor: 'pointer',
}

function MonthYearPicker({ value, onChange, lang }: {
  value: string
  onChange: (v: string) => void
  lang: string
}) {
  const [year, month] = value.split('-').map(Number)
  const shortMonths = (translations[lang as keyof typeof translations] as Record<string, unknown>)
  const names = ((shortMonths?.months as { short: string[] })?.short) ??
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = 2020; y <= currentYear + 1; y++) years.push(y)

  return (
    <div className="flex items-center gap-1">
      <select value={year} onChange={e => onChange(`${e.target.value}-${String(month).padStart(2, '0')}`)} style={SELECT_STYLE}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select value={month} onChange={e => onChange(`${year}-${String(e.target.value).padStart(2, '0')}`)} style={SELECT_STYLE}>
        {names.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
      </select>
    </div>
  )
}

interface PupilFiltersProps {
  viewMode: 'active' | 'inactive'
  onViewModeChange: (v: 'active' | 'inactive') => void
  fromMonth: string
  onFromMonthChange: (v: string) => void
  toMonth: string
  onToMonthChange: (v: string) => void
  statusFilters: Set<MonthOverrideStatus>
  onStatusToggle: (s: MonthOverrideStatus) => void
}

export default function PupilFilters({
  viewMode,
  onViewModeChange,
  fromMonth,
  onFromMonthChange,
  toMonth,
  onToMonthChange,
  statusFilters,
  onStatusToggle,
}: PupilFiltersProps) {
  const { t, lang } = useLanguage()
  const [isMobile, setIsMobile] = useState(false)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const activeFilterCount = statusFilters.size

  if (isMobile) {
    return (
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #d0d7de' }}>
        {/* Mobile primary row: toggle + search + filter button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', flexWrap: 'wrap' }}>
          {/* Active / Inactive toggle */}
          <div className="flex rounded overflow-hidden border" style={{ borderColor: '#d0d7de' }}>
            <button
              onClick={() => onViewModeChange('active')}
              className="px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: viewMode === 'active' ? '#1e293b' : '#fff',
                color: viewMode === 'active' ? '#fff' : '#374151',
              }}
            >
              {t('pupils.active')}
            </button>
            <button
              onClick={() => onViewModeChange('inactive')}
              className="px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: viewMode === 'inactive' ? '#1e293b' : '#fff',
                color: viewMode === 'inactive' ? '#fff' : '#374151',
              }}
            >
              {t('pupils.inactive')}
            </button>
          </div>

          {/* Expand/collapse button for date + status filters */}
          <button
            onClick={() => setFiltersExpanded(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', fontSize: 11, borderRadius: 4,
              border: '1px solid #d0d7de',
              backgroundColor: (filtersExpanded || activeFilterCount > 0) ? '#1e293b' : '#fff',
              color: (filtersExpanded || activeFilterCount > 0) ? '#fff' : '#374151',
              cursor: 'pointer', fontWeight: 600, flexShrink: 0,
            }}
          >
            ▼ {t('pupils.filters') || 'Filters'}
            {activeFilterCount > 0 && (
              <span style={{
                backgroundColor: '#ef4444', color: '#fff',
                borderRadius: 10, fontSize: 10, fontWeight: 700,
                padding: '0 5px', minWidth: 16, textAlign: 'center',
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded mobile filters: date range + status chips */}
        {filtersExpanded && (
          <div style={{ padding: '8px 12px 10px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Date range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <MonthYearPicker value={fromMonth} onChange={onFromMonthChange} lang={lang} />
              <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
              <MonthYearPicker value={toMonth} onChange={onToMonthChange} lang={lang} />
            </div>

            {/* Status filter chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STATUS_OPTIONS.map(({ value, bg, text }) => {
                const active = statusFilters.has(value)
                return (
                  <button
                    key={value}
                    onClick={() => onStatusToggle(value)}
                    className="px-2 py-0.5 text-xs rounded border transition-all"
                    style={{
                      backgroundColor: bg,
                      color: text,
                      borderColor: active ? text : 'transparent',
                      borderWidth: active ? 2 : 1,
                      fontWeight: active ? 700 : 400,
                      outline: active ? `2px solid ${text}` : 'none',
                      outlineOffset: 1,
                    }}
                  >
                    {t(`status.${value}`)}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop layout
  return (
    <div
      className="flex flex-wrap items-center gap-2 px-3 py-2 border-b"
      style={{ backgroundColor: '#fff', borderColor: '#d0d7de' }}
    >
      {/* Active / Inactive toggle */}
      <div className="flex rounded overflow-hidden border" style={{ borderColor: '#d0d7de' }}>
        <button
          onClick={() => onViewModeChange('active')}
          className="px-3 py-1 text-xs font-medium transition-colors"
          style={{
            backgroundColor: viewMode === 'active' ? '#1e293b' : '#fff',
            color: viewMode === 'active' ? '#fff' : '#374151',
          }}
        >
          {t('pupils.active')}
        </button>
        <button
          onClick={() => onViewModeChange('inactive')}
          className="px-3 py-1 text-xs font-medium transition-colors"
          style={{
            backgroundColor: viewMode === 'inactive' ? '#1e293b' : '#fff',
            color: viewMode === 'inactive' ? '#fff' : '#374151',
          }}
        >
          {t('pupils.inactive')}
        </button>
      </div>

      {/* Month range */}
      <MonthYearPicker value={fromMonth} onChange={onFromMonthChange} lang={lang} />
      <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
      <MonthYearPicker value={toMonth} onChange={onToMonthChange} lang={lang} />

      {/* Status filter chips */}
      <div className="flex items-center gap-1">
        {STATUS_OPTIONS.map(({ value, bg, text }) => {
          const active = statusFilters.has(value)
          return (
            <button
              key={value}
              onClick={() => onStatusToggle(value)}
              className="px-2 py-0.5 text-xs rounded border transition-all"
              style={{
                backgroundColor: bg,
                color: text,
                borderColor: active ? text : 'transparent',
                borderWidth: active ? 2 : 1,
                fontWeight: active ? 700 : 400,
                outline: active ? `2px solid ${text}` : 'none',
                outlineOffset: 1,
              }}
            >
              {t(`status.${value}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
