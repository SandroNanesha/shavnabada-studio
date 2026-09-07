'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Pupil, Group, PaymentClassification, Payment, MonthOverrideStatus } from '@/types'
import { computeLedger, combinedMonthStatus, generateMonths, deriveStatus, effectiveFee } from '@/lib/ledger'
import { useAppState } from '@/lib/state/context'
import { useLanguage } from '@/lib/i18n/context'
import PupilFilters from './PupilFilters'
import PupilsTable from './PupilsTable'
import OverrideModal, { type OverrideStatus, type OverrideTarget } from './OverrideModal'
import AddPupilModal from './AddPupilModal'

interface PupilsViewProps {
  pupils: Pupil[]
  initialNextCursor: string | null
  groups: Group[]
  classifications: PaymentClassification[]
  payments: Payment[]
}

interface ModalState {
  pupil: Pupil
  month: string
}

// enrollmentId -> YYYY-MM -> status
type OverrideMap = Record<string, Record<string, MonthOverrideStatus>>

export default function PupilsView({ pupils, initialNextCursor, groups, classifications, payments }: PupilsViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const {
    pupilFilters, setPupilFilters,
    monthOverrides: overrides, paidAmountOverrides, dueOverrides,
    archivedOverrides, pupilEdits,
    setMonthOverride, setPaidAmountOverride, setDueOverride,
    addedPupils, addPupil,
  } = useAppState()

  const [showAddModal, setShowAddModal] = useState(false)
  const [extraPupils, setExtraPupils] = useState<Pupil[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/pupils?cursor=${nextCursor}`)
      const data = await res.json() as { pupils: Pupil[]; nextCursor: string | null }
      setExtraPupils(prev => [...prev, ...data.pupils])
      setNextCursor(data.nextCursor)
    } finally {
      setLoadingMore(false)
    }
  }

  const { search, groupFilter, viewMode, fromMonth, toMonth, statusFilters: statusFiltersArr } = pupilFilters
  const statusFilters = new Set(statusFiltersArr)

  const setSearch = (v: string) => setPupilFilters({ search: v })
  const setGroupFilter = (v: string) => setPupilFilters({ groupFilter: v })
  const setViewMode = (v: 'active' | 'inactive') => setPupilFilters({ viewMode: v })
  const setFromMonth = (v: string) => setPupilFilters({ fromMonth: v })
  const setToMonth = (v: string) => setPupilFilters({ toMonth: v })

  const [modalState, setModalState] = useState<ModalState | null>(null)

  const months = useMemo(() => generateMonths(fromMonth, toMonth), [fromMonth, toMonth])

  const allPupils = useMemo(() => {
    const seen = new Set<string>()
    const base = [...addedPupils, ...pupils, ...extraPupils].filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
    if (Object.keys(pupilEdits).length === 0) return base
    return base.map(p => p.id in pupilEdits ? { ...p, ...pupilEdits[p.id] } : p)
  }, [addedPupils, pupils, extraPupils, pupilEdits])

  const pupilsWithOverrides = useMemo(() => {
    if (Object.keys(overrides).length === 0 && Object.keys(paidAmountOverrides).length === 0 && Object.keys(dueOverrides).length === 0) return allPupils
    return allPupils.map(pupil => ({
      ...pupil,
      enrollments: pupil.enrollments.map(e => ({
        ...e,
        monthOverrides: overrides[e.id]
          ? { ...e.monthOverrides, ...overrides[e.id] }
          : e.monthOverrides,
        monthPaidAmountOverrides: paidAmountOverrides[e.id]
          ? { ...(e.monthPaidAmountOverrides ?? {}), ...paidAmountOverrides[e.id] }
          : e.monthPaidAmountOverrides,
        monthDueOverrides: dueOverrides[e.id]
          ? { ...(e.monthDueOverrides ?? {}), ...dueOverrides[e.id] }
          : e.monthDueOverrides,
      })),
    }))
  }, [allPupils, overrides, paidAmountOverrides, dueOverrides])

  const filteredPupils = useMemo(() => {
    let result = pupilsWithOverrides.filter(p => {
      const archived = p.id in archivedOverrides ? archivedOverrides[p.id] : p.archived
      return archived === (viewMode === 'inactive')
    })

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(p => {
        const full = `${p.firstName} ${p.surname}`.toLowerCase()
        const fullRev = `${p.surname} ${p.firstName}`.toLowerCase()
        return full.includes(q) || fullRev.includes(q)
      })
    }

    if (groupFilter) {
      result = result.filter(p => p.enrollments.some(e => e.groupId === groupFilter))
    }

    if (statusFilters.size > 0) {
      result = result.filter(p => {
        for (const month of months) {
          const statuses = p.enrollments
            .filter(e => generateMonths(e.startDate, e.endDate).includes(month))
            .map(e => {
              const ledger = computeLedger(e, payments, classifications)
              return ledger.find(l => l.month === month)?.status ?? null
            })
            .filter((s): s is MonthOverrideStatus => s !== null)
          const combined = combinedMonthStatus(statuses)
          if (combined && statusFilters.has(combined)) return true
        }
        return false
      })
    }

    return result
  }, [pupilsWithOverrides, viewMode, search, groupFilter, statusFilters, months, payments, classifications, archivedOverrides])

  const toggleStatus = (s: MonthOverrideStatus) => {
    const next = new Set(statusFilters)
    if (next.has(s)) { next.delete(s) } else { next.add(s) }
    setPupilFilters({ statusFilters: Array.from(next) })
  }

  // Compute modal targets when modal is open
  const modalTargets = useMemo((): OverrideTarget[] => {
    if (!modalState) return []
    const { pupil, month } = modalState
    const pupilWithOvr = pupilsWithOverrides.find(p => p.id === pupil.id) ?? pupil

    return pupilWithOvr.enrollments
      .filter(e => generateMonths(e.startDate, e.endDate).includes(month))
      .flatMap(e => {
        const ledger = computeLedger(e, payments, classifications)
        const lm = ledger.find(l => l.month === month)
        if (!lm) return []
        return [{
          enrollmentId: e.id,
          groupName: groups.find(g => g.id === e.groupId)?.name ?? '—',
          ledgerMonth: lm,
          computedStatus: deriveStatus(lm.due, lm.paid),
          standardFee: effectiveFee(e, classifications),
          currentDueOverride: dueOverrides[e.id]?.[month] ?? e.monthDueOverrides?.[month],
          currentPaidOverride: paidAmountOverrides[e.id]?.[month],
        }]
      })
  }, [modalState, pupilsWithOverrides, payments, classifications, groups, dueOverrides, paidAmountOverrides])

  const handleCellClick = (pupil: Pupil, month: string) => {
    setModalState({ pupil, month })
  }

  const handleSave = (changes: { enrollmentId: string; status: OverrideStatus; paidAmount?: number; customDue?: number | null; customPaid?: number | null }[]) => {
    if (!modalState) return
    const { month } = modalState
    for (const { enrollmentId, status, paidAmount, customDue, customPaid } of changes) {
      if (customDue !== undefined) setDueOverride(enrollmentId, month, customDue)
      const effectivePaid = customPaid !== undefined ? customPaid : paidAmount
      if (effectivePaid !== undefined) setPaidAmountOverride(enrollmentId, month, effectivePaid)
      const effectiveStatus = status === 'auto' ? null : status as MonthOverrideStatus
      setMonthOverride(enrollmentId, month, effectiveStatus)

      fetch(`/api/enrollments/${enrollmentId}/overrides`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          status: effectiveStatus,
          customDue: customDue !== undefined ? customDue : undefined,
          customPaid: effectivePaid !== undefined ? effectivePaid : undefined,
        }),
      })
    }
    setModalState(null)
  }

  return (
    <div className="flex flex-col h-screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', flexWrap: 'wrap' }}>
        {/* Search with icon */}
        <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 320 }}>
          <svg
            width="13" height="13" viewBox="0 0 20 20" fill="none"
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}
          >
            <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.8"/>
            <line x1="13" y1="13" x2="18" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('pupils.search_placeholder')}
            style={{
              width: '100%', padding: '5px 8px 5px 28px', fontSize: 12,
              border: '1px solid #d0d7de', borderRadius: 4, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ padding: '6px 14px', fontSize: 12, borderRadius: 4, border: 'none', backgroundColor: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 600, touchAction: 'manipulation', flexShrink: 0, marginLeft: 'auto' }}
        >
          + {t('pupils.add_pupil')}
        </button>
      </div>
      <PupilFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        fromMonth={fromMonth}
        onFromMonthChange={setFromMonth}
        toMonth={toMonth}
        onToMonthChange={setToMonth}
        statusFilters={statusFilters}
        onStatusToggle={toggleStatus}
      />

      <div className="flex-1 overflow-hidden">
        <PupilsTable
          pupils={filteredPupils}
          groups={groups}
          classifications={classifications}
          payments={payments}
          fromMonth={fromMonth}
          toMonth={toMonth}
          groupFilter={groupFilter}
          onGroupFilterChange={setGroupFilter}
          onCellClick={handleCellClick}
        />
        {nextCursor && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{ fontSize: 12, color: '#1d4ed8', background: 'none', border: '1px solid #bfdbfe', borderRadius: 4, padding: '5px 14px', cursor: loadingMore ? 'not-allowed' : 'pointer', opacity: loadingMore ? 0.6 : 1 }}
            >
              {loadingMore ? t('common.loading') : t('pupils.load_more')}
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddPupilModal
          groups={groups}
          classifications={classifications}
          onSave={p => { addPupil(p); setShowAddModal(false); router.refresh() }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {modalState && (
        <OverrideModal
          pupilName={`${modalState.pupil.firstName} ${modalState.pupil.surname}`}
          month={modalState.month}
          targets={modalTargets}
          onSave={handleSave}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  )
}
