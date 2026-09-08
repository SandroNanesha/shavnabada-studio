'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Pupil, Group, PaymentClassification, Payment, MonthOverrideStatus } from '@/types'
import { computeLedger, deriveStatus, effectiveFee, generateMonths } from '@/lib/ledger'
import { useLanguage } from '@/lib/i18n/context'
import { useAppState } from '@/lib/state/context'
import EnrollmentCard from './EnrollmentCard'
import OverrideModal, { type OverrideStatus, type OverrideTarget } from './OverrideModal'
import AddEnrollmentModal from './AddEnrollmentModal'
import RenewEnrollmentModal from './RenewEnrollmentModal'

interface PupilDetailProps {
  pupil: Pupil
  groups: Group[]
  classifications: PaymentClassification[]
  payments: Payment[]
}

export default function PupilDetail({ pupil, groups, classifications, payments }: PupilDetailProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const {
    monthOverrides, paidAmountOverrides, dueOverrides, classificationOverrides,
    setMonthOverride, setPaidAmountOverride, setDueOverride, setClassificationOverride,
    futureMonths,
  } = useAppState()

  const [modalMonth, setModalMonth] = useState<string | null>(null)
  const [modalEnrollmentId, setModalEnrollmentId] = useState<string | null>(null)
  const [showAddEnrollment, setShowAddEnrollment] = useState(false)
  const [renewingEnrollmentId, setRenewingEnrollmentId] = useState<string | null>(null)
  const [endedOpen, setEndedOpen] = useState(false)

  const pupilPayments = payments.filter(p => p.pupilId === pupil.id)

  const enrollmentsWithOverrides = useMemo(() =>
    pupil.enrollments.map(e => ({
      ...e,
      monthOverrides: monthOverrides[e.id]
        ? { ...e.monthOverrides, ...monthOverrides[e.id] }
        : e.monthOverrides,
      monthPaidAmountOverrides: paidAmountOverrides[e.id]
        ? { ...(e.monthPaidAmountOverrides ?? {}), ...paidAmountOverrides[e.id] }
        : e.monthPaidAmountOverrides,
      monthDueOverrides: dueOverrides[e.id]
        ? { ...(e.monthDueOverrides ?? {}), ...dueOverrides[e.id] }
        : e.monthDueOverrides,
      classificationId: e.id in classificationOverrides
        ? classificationOverrides[e.id]
        : e.classificationId,
    })),
    [pupil.enrollments, monthOverrides, paidAmountOverrides, dueOverrides, classificationOverrides]
  )

  // For a given month, collect ALL enrollments active that month
  const modalTargets = useMemo((): OverrideTarget[] => {
    if (!modalMonth || !modalEnrollmentId) return []
    return enrollmentsWithOverrides
      .filter(e => e.id === modalEnrollmentId && generateMonths(e.startDate, e.endDate, futureMonths).includes(modalMonth))
      .flatMap(e => {
        const lm = computeLedger(e, pupilPayments, classifications).find(l => l.month === modalMonth)
        if (!lm) return []
        return [{
          enrollmentId: e.id,
          groupName: groups.find(g => g.id === e.groupId)?.name ?? '—',
          ledgerMonth: lm,
          computedStatus: deriveStatus(lm.due, lm.paid),
          standardFee: effectiveFee(e, classifications),
          currentDueOverride: dueOverrides[e.id]?.[modalMonth] ?? e.monthDueOverrides?.[modalMonth],
          currentPaidOverride: paidAmountOverrides[e.id]?.[modalMonth],
        }]
      })
  }, [modalMonth, modalEnrollmentId, enrollmentsWithOverrides, pupilPayments, classifications, groups, dueOverrides, paidAmountOverrides])

  const handleSave = (changes: { enrollmentId: string; status: OverrideStatus; paidAmount?: number; customDue?: number | null; customPaid?: number | null }[]) => {
    if (!modalMonth) return
    for (const { enrollmentId, status, paidAmount, customDue, customPaid } of changes) {
      if (customDue !== undefined) setDueOverride(enrollmentId, modalMonth, customDue)
      const effectivePaid = customPaid !== undefined ? customPaid : paidAmount
      if (effectivePaid !== undefined) setPaidAmountOverride(enrollmentId, modalMonth, effectivePaid)
      const effectiveStatus = status === 'auto' ? null : status as MonthOverrideStatus
      setMonthOverride(enrollmentId, modalMonth, effectiveStatus)

      fetch(`/api/enrollments/${enrollmentId}/overrides`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: modalMonth,
          status: effectiveStatus,
          customDue: customDue !== undefined ? customDue : undefined,
          customPaid: effectivePaid !== undefined ? effectivePaid : undefined,
        }),
      })
    }
    setModalMonth(null)
    setModalEnrollmentId(null)
  }

  const handleEndEnrollment = async (enrollmentId: string, endDate: string) => {
    await fetch(`/api/enrollments/${enrollmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endDate }),
    })
    router.refresh()
  }


  const activeEnrollments = enrollmentsWithOverrides.filter(e => !e.endDate)
  const endedEnrollments = enrollmentsWithOverrides.filter(e => !!e.endDate)

  const enrollmentCard = (enrollment: typeof enrollmentsWithOverrides[0], ended = false) => (
    <EnrollmentCard
      key={enrollment.id}
      enrollment={enrollment}
      groups={groups}
      classifications={classifications}
      payments={pupilPayments}
      onCellClick={ended ? undefined : (month, enrollmentId) => { setModalMonth(month); setModalEnrollmentId(enrollmentId) }}
      onClassificationChange={ended ? undefined : id => {
        setClassificationOverride(enrollment.id, id)
        fetch(`/api/enrollments/${enrollment.id}/overrides`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classificationId: id }),
        })
      }}
      onEndEnrollment={ended ? undefined : endDate => handleEndEnrollment(enrollment.id, endDate)}
      onRenew={ended ? () => setRenewingEnrollmentId(enrollment.id) : undefined}
    />
  )

  return (
    <div className="space-y-6">
      {/* Active enrollments */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #e5e7eb', paddingBottom: 6, marginBottom: 12 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>
            {t('pupil_detail.enrollments')}
          </h2>
          <button
            onClick={() => setShowAddEnrollment(true)}
            style={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8', background: 'none', border: '1px dashed #93c5fd', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}
          >
            + {t('pupils.add_enrollment')}
          </button>
        </div>
        {activeEnrollments.length === 0 ? (
          <p style={{ fontSize: 12, color: '#9ca3af' }}>{t('pupil_detail.no_enrollments')}</p>
        ) : (
          <div className="space-y-4">
            {activeEnrollments.map(e => enrollmentCard(e, false))}
          </div>
        )}
      </section>

      {/* Ended enrollments — collapsible */}
      {endedEnrollments.length > 0 && (
        <section>
          <button
            onClick={() => setEndedOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontSize: 12, fontWeight: 600, color: '#6b7280', width: '100%', borderBottom: '1px solid #e5e7eb', paddingBottom: 6, marginBottom: endedOpen ? 12 : 0 }}
          >
            <span style={{ fontSize: 10 }}>{endedOpen ? '▾' : '▸'}</span>
            {t('pupils.ended_enrollments')} ({endedEnrollments.length})
          </button>
          {endedOpen && (
            <div className="space-y-4">
              {endedEnrollments.map(e => enrollmentCard(e, true))}
            </div>
          )}
        </section>
      )}

      {modalMonth && modalTargets.length > 0 && (
        <OverrideModal
          pupilName={`${pupil.firstName} ${pupil.surname}`}
          month={modalMonth}
          targets={modalTargets}
          onSave={handleSave}
          onClose={() => { setModalMonth(null); setModalEnrollmentId(null) }}
        />
      )}

      {showAddEnrollment && (
        <AddEnrollmentModal
          pupilId={pupil.id}
          groups={groups}
          classifications={classifications}
          onSave={() => { setShowAddEnrollment(false); router.refresh() }}
          onClose={() => setShowAddEnrollment(false)}
        />
      )}

      {renewingEnrollmentId && (() => {
        const e = enrollmentsWithOverrides.find(e => e.id === renewingEnrollmentId)
        if (!e) return null
        const group = groups.find(g => g.id === e.groupId)
        return (
          <RenewEnrollmentModal
            enrollmentId={renewingEnrollmentId}
            groupName={group?.name ?? '—'}
            currentClassificationId={e.classificationId}
            groups={groups}
            classifications={classifications}
            onSave={() => { setRenewingEnrollmentId(null); router.refresh() }}
            onClose={() => setRenewingEnrollmentId(null)}
          />
        )
      })()}
    </div>
  )
}
