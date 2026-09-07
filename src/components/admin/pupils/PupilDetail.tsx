'use client'

import { useState, useMemo } from 'react'
import type { Pupil, Group, PaymentClassification, Payment, MonthOverrideStatus, LedgerMonth } from '@/types'
import { computeLedger, deriveStatus, effectiveFee } from '@/lib/ledger'
import { useLanguage } from '@/lib/i18n/context'
import { useAppState } from '@/lib/state/context'
import EnrollmentCard from './EnrollmentCard'
import OverrideModal, { type OverrideStatus, type OverrideTarget } from './OverrideModal'

interface PupilDetailProps {
  pupil: Pupil
  groups: Group[]
  classifications: PaymentClassification[]
  payments: Payment[]
}

interface ModalState {
  enrollmentId: string
  month: string
  lm: LedgerMonth
}

export default function PupilDetail({ pupil, groups, classifications, payments }: PupilDetailProps) {
  const { t } = useLanguage()
  const {
    monthOverrides, paidAmountOverrides, dueOverrides, classificationOverrides,
    setMonthOverride, setPaidAmountOverride, setDueOverride, setClassificationOverride,
  } = useAppState()

  const [modalState, setModalState] = useState<ModalState | null>(null)

  const pupilPayments = payments.filter(p => p.pupilId === pupil.id)

  // Merge global overrides into enrollments before computation
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

  const modalTargets = useMemo((): OverrideTarget[] => {
    if (!modalState) return []
    const { enrollmentId, month, lm } = modalState
    const enrollment = enrollmentsWithOverrides.find(e => e.id === enrollmentId)
    if (!enrollment) return []
    const stdFee = effectiveFee(enrollment, classifications)
    return [{
      enrollmentId,
      groupName: groups.find(g => g.id === enrollment.groupId)?.name ?? '—',
      ledgerMonth: lm,
      computedStatus: deriveStatus(lm.due, lm.paid),
      standardFee: stdFee,
      currentDueOverride: dueOverrides[enrollmentId]?.[modalState.month] ?? enrollment.monthDueOverrides?.[modalState.month],
      currentPaidOverride: paidAmountOverrides[enrollmentId]?.[modalState.month],
    }]
  }, [modalState, enrollmentsWithOverrides, groups, classifications, dueOverrides])

  const handleSave = (changes: { enrollmentId: string; status: OverrideStatus; paidAmount?: number; customDue?: number | null; customPaid?: number | null }[]) => {
    if (!modalState) return
    const { month } = modalState
    for (const { enrollmentId, status, paidAmount, customDue, customPaid } of changes) {
      // due override — independent
      if (customDue !== undefined) setDueOverride(enrollmentId, month, customDue)
      // paid override — independent (single-pupil-page uses customPaid, list-page uses paidAmount)
      const effectivePaid = customPaid !== undefined ? customPaid : paidAmount
      if (effectivePaid !== undefined) setPaidAmountOverride(enrollmentId, month, effectivePaid)
      // status override — independent
      const effectiveStatus = status === 'auto' ? null : status as MonthOverrideStatus
      setMonthOverride(enrollmentId, month, effectiveStatus)

      // Persist to DB
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
    <div className="space-y-6">
      {/* Enrollments */}
      <section>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: 6, marginBottom: 12 }}>
          {t('pupil_detail.enrollments')}
        </h2>
        {enrollmentsWithOverrides.length === 0 ? (
          <p style={{ fontSize: 12, color: '#9ca3af' }}>{t('pupil_detail.no_enrollments')}</p>
        ) : (
          <div className="space-y-4">
            {enrollmentsWithOverrides.map(enrollment => (
              <EnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                groups={groups}
                classifications={classifications}
                payments={pupilPayments}
                onCellClick={(month, lm) => setModalState({ enrollmentId: enrollment.id, month, lm })}
                onClassificationChange={id => {
                  setClassificationOverride(enrollment.id, id)
                  fetch(`/api/enrollments/${enrollment.id}/overrides`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ classificationId: id }),
                  })
                }}
              />
            ))}
          </div>
        )}
      </section>

      {modalState && modalTargets.length > 0 && (
        <OverrideModal
          pupilName={`${pupil.firstName} ${pupil.surname}`}
          month={modalState.month}
          targets={modalTargets}
          onSave={handleSave}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  )
}
