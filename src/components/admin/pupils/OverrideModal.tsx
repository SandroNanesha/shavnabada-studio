'use client'

import { useState, useEffect } from 'react'
import type { MonthOverrideStatus, LedgerMonth } from '@/types'
import { useLanguage } from '@/lib/i18n/context'

export type OverrideStatus = MonthOverrideStatus | 'auto'

export interface OverrideTarget {
  enrollmentId: string
  groupName: string
  ledgerMonth: LedgerMonth
  computedStatus: MonthOverrideStatus
  standardFee?: number          // if provided, shows custom due/paid inputs
  currentDueOverride?: number
  currentPaidOverride?: number
}

interface OverrideModalProps {
  pupilName: string
  month: string
  targets: OverrideTarget[]
  onSave: (changes: { enrollmentId: string; status: OverrideStatus; paidAmount?: number; customDue?: number | null; customPaid?: number | null }[]) => void
  onClose: () => void
}

const STATUS_OPTIONS: OverrideStatus[] = ['auto', 'paid', 'partial', 'unpaid', 'confusion', 'exempt']

const STATUS_COLORS: Record<MonthOverrideStatus, { bg: string; text: string }> = {
  paid:      { bg: '#c6efce', text: '#276221' },
  partial:   { bg: '#ffeb9c', text: '#9c6500' },
  unpaid:    { bg: '#ffc7ce', text: '#9c0006' },
  confusion: { bg: '#ffcc99', text: '#7f4700' },
  exempt:    { bg: '#deebf7', text: '#2f5496' },
}

function formatMonth(month: string, longMonths: string[]): string {
  const [year, m] = month.split('-').map(Number)
  return `${longMonths[m - 1]} ${year}`
}

export default function OverrideModal({ pupilName, month, targets, onSave, onClose }: OverrideModalProps) {
  const { t, lang } = useLanguage()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const longMonths = lang === 'ka'
    ? ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  // Per-enrollment selected status. Default = current override if set, else 'auto'
  const [selections, setSelections] = useState<Record<string, OverrideStatus>>(() => {
    const init: Record<string, OverrideStatus> = {}
    for (const target of targets) {
      init[target.enrollmentId] = target.ledgerMonth.isOverride
        ? target.ledgerMonth.status
        : 'auto'
    }
    return init
  })

  // Per-enrollment partial paid amount
  const [partialAmounts, setPartialAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const target of targets) {
      if (target.ledgerMonth.isOverride && target.ledgerMonth.status === 'partial') {
        init[target.enrollmentId] = String(target.ledgerMonth.paid)
      }
    }
    return init
  })

  const [dueInputs, setDueInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const t of targets) {
      if (t.standardFee !== undefined)
        init[t.enrollmentId] = String(t.currentDueOverride ?? t.standardFee)
    }
    return init
  })

  const [paidInputs, setPaidInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const t of targets) {
      if (t.standardFee !== undefined)
        init[t.enrollmentId] = String(t.currentPaidOverride ?? t.ledgerMonth.paid)
    }
    return init
  })

  // Tracks which due/paid fields have been explicitly confirmed after modification
  const [dueConfirmed, setDueConfirmed] = useState<Record<string, boolean>>({})
  const [paidConfirmed, setPaidConfirmed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const initSel: Record<string, OverrideStatus> = {}
    const initAmt: Record<string, string> = {}
    const initDue: Record<string, string> = {}
    const initPaid: Record<string, string> = {}
    for (const target of targets) {
      initSel[target.enrollmentId] = target.ledgerMonth.isOverride ? target.ledgerMonth.status : 'auto'
      if (target.ledgerMonth.isOverride && target.ledgerMonth.status === 'partial')
        initAmt[target.enrollmentId] = String(target.ledgerMonth.paid)
      if (target.standardFee !== undefined) {
        initDue[target.enrollmentId] = String(target.currentDueOverride ?? target.standardFee)
        initPaid[target.enrollmentId] = String(target.currentPaidOverride ?? target.ledgerMonth.paid)
      }
    }
    setSelections(initSel)
    setPartialAmounts(initAmt)
    setDueInputs(initDue)
    setPaidInputs(initPaid)
    setDueConfirmed({})
    setPaidConfirmed({})
  }, [targets])

  // Returns true if a due or paid field was changed from its original value but not yet confirmed
  const hasUnconfirmedChanges = targets.some(tgt => {
    if (tgt.standardFee === undefined) return false
    const dueChanged = parseFloat(dueInputs[tgt.enrollmentId] ?? '') !== (tgt.currentDueOverride ?? tgt.standardFee)
    const paidChanged = parseFloat(paidInputs[tgt.enrollmentId] ?? '') !== (tgt.currentPaidOverride ?? tgt.ledgerMonth.paid)
    if (dueChanged && !dueConfirmed[tgt.enrollmentId]) return true
    if (paidChanged && !paidConfirmed[tgt.enrollmentId]) return true
    return false
  })

  const handleSave = () => {
    const changes = targets.map(tgt => {
      const status = selections[tgt.enrollmentId] ?? 'auto'
      // list-page partial inline amount (only when no standardFee)
      const rawAmount = partialAmounts[tgt.enrollmentId]
      const paidAmount = tgt.standardFee === undefined && status === 'partial' && rawAmount !== undefined
        ? Math.max(0, Number(rawAmount) || 0)
        : undefined
      // single-pupil-page independent fields
      let customDue: number | null | undefined = undefined
      let customPaid: number | null | undefined = undefined
      if (tgt.standardFee !== undefined) {
        const parsedDue = parseFloat(dueInputs[tgt.enrollmentId] ?? '')
        customDue = isNaN(parsedDue) || parsedDue === tgt.standardFee ? null : parsedDue
        const parsedPaid = parseFloat(paidInputs[tgt.enrollmentId] ?? '')
        const baseline = tgt.currentPaidOverride ?? tgt.ledgerMonth.paid
        customPaid = isNaN(parsedPaid) || parsedPaid === baseline && tgt.currentPaidOverride === undefined ? null : parsedPaid
      }
      return { enrollmentId: tgt.enrollmentId, status, paidAmount, customDue, customPaid }
    })
    onSave(changes)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) handleSave()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const backdropStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: '#fff', overflowY: 'auto' }
    : { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.4)', overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: 16 }

  const modalBoxStyle: React.CSSProperties = isMobile
    ? { backgroundColor: '#fff', width: '100%', minHeight: '100%' }
    : { backgroundColor: '#fff', border: '1px solid #d0d7de', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: '100%', maxWidth: 480, margin: 'auto' }

  const headerBorderRadius = isMobile ? 0 : '6px 6px 0 0'
  const footerBorderRadius = isMobile ? 0 : '0 0 6px 6px'

  return (
    <div
      onClick={isMobile ? undefined : handleBackdrop}
      style={backdropStyle}
    >
      <div style={modalBoxStyle}>
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #d0d7de',
            backgroundColor: '#f6f8fa',
            borderRadius: headerBorderRadius,
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>
              {t('override.title')}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              {pupilName} — {formatMonth(month, longMonths)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 18, color: '#6b7280', lineHeight: 1, padding: '2px 6px',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {targets.length === 0 && (
            <div style={{ padding: '16px 0', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
              {t('override.no_enrollment')}
            </div>
          )}
          {targets.map(target => {
            const selected = selections[target.enrollmentId] ?? 'auto'
            const currentStatusStyle = STATUS_COLORS[target.ledgerMonth.status]

            return (
              <div
                key={target.enrollmentId}
                style={{ border: '1px solid #d0d7de', borderRadius: 4, overflow: 'hidden' }}
              >
                {/* Enrollment header */}
                <div
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f6f8fa',
                    borderBottom: '1px solid #d0d7de',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                    {target.groupName}
                  </span>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#6b7280' }}>
                    <span>{t('override.fee')}: <strong style={{ color: '#374151' }}>₾{target.ledgerMonth.due}</strong></span>
                    <span>{t('override.recorded')}: <strong style={{ color: '#374151' }}>₾{target.ledgerMonth.paid}</strong></span>
                    <span>
                      {t('override.computed')}:{' '}
                      <span
                        style={{
                          backgroundColor: STATUS_COLORS[target.computedStatus]?.bg,
                          color: STATUS_COLORS[target.computedStatus]?.text,
                          padding: '1px 5px', borderRadius: 3, fontWeight: 600, fontSize: 10,
                        }}
                      >
                        {t(`status.${target.computedStatus}`)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Custom due + paid — only on single-pupil page */}
                {target.standardFee !== undefined && (() => {
                  const dueOriginal = target.currentDueOverride ?? target.standardFee
                  const paidOriginal = target.currentPaidOverride ?? target.ledgerMonth.paid
                  const dueVal = parseFloat(dueInputs[target.enrollmentId] ?? '')
                  const paidVal = parseFloat(paidInputs[target.enrollmentId] ?? '')
                  const dueChanged = dueVal !== dueOriginal
                  const paidChanged = paidVal !== paidOriginal
                  const dueNeedsConfirm = dueChanged && !dueConfirmed[target.enrollmentId]
                  const paidNeedsConfirm = paidChanged && !paidConfirmed[target.enrollmentId]

                  return (
                    <div style={{ borderBottom: '1px solid #e5e7eb' }}>
                      {/* Due row */}
                      <div style={{ padding: '8px 12px 6px', backgroundColor: '#fffbeb', borderBottom: '1px solid #fef9c3' }}>
                        <div style={{ fontSize: 10, color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                          {t('override.custom_due')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>₾</span>
                          <input
                            type="number"
                            min={0}
                            value={dueInputs[target.enrollmentId] ?? ''}
                            onChange={e => {
                              setDueInputs(prev => ({ ...prev, [target.enrollmentId]: e.target.value }))
                              setDueConfirmed(prev => ({ ...prev, [target.enrollmentId]: false }))
                            }}
                            style={{ width: 80, padding: '3px 6px', fontSize: 12, border: `1px solid ${dueNeedsConfirm ? '#f97316' : '#fcd34d'}`, borderRadius: 3, outline: 'none', backgroundColor: '#fff' }}
                          />
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>{t('override.standard_fee')}: ₾{target.standardFee}</span>
                          {dueChanged && (
                            <button
                              onClick={() => {
                                setDueInputs(prev => ({ ...prev, [target.enrollmentId]: String(dueOriginal) }))
                                setDueConfirmed(prev => ({ ...prev, [target.enrollmentId]: false }))
                              }}
                              style={{ fontSize: 10, color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                            >
                              {t('override.reset_due')}
                            </button>
                          )}
                        </div>
                        {/* Confirmation for due */}
                        {dueNeedsConfirm && (
                          <div style={{ marginTop: 8, padding: '8px 10px', backgroundColor: '#fff7ed', border: '1px solid #fb923c', borderRadius: 4 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#9a3412', marginBottom: 8 }}>
                              {t('override.confirm_due_question')}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => setDueConfirmed(prev => ({ ...prev, [target.enrollmentId]: true }))}
                                style={{ padding: '4px 12px', fontSize: 11, fontWeight: 700, borderRadius: 4, border: 'none', backgroundColor: '#ea580c', color: '#fff', cursor: 'pointer' }}
                              >
                                {t('override.confirm_change')}
                              </button>
                              <button
                                onClick={() => {
                                  setDueInputs(prev => ({ ...prev, [target.enrollmentId]: String(dueOriginal) }))
                                  setDueConfirmed(prev => ({ ...prev, [target.enrollmentId]: false }))
                                }}
                                style={{ padding: '4px 12px', fontSize: 11, borderRadius: 4, border: '1px solid #d0d7de', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}
                              >
                                {t('override.reset_due')}
                              </button>
                            </div>
                          </div>
                        )}
                        {dueChanged && !dueNeedsConfirm && (
                          <div style={{ marginTop: 6, fontSize: 10, color: '#15803d', fontWeight: 600 }}>
                            {t('override.confirmed')}
                          </div>
                        )}
                      </div>
                      {/* Paid row */}
                      <div style={{ padding: '8px 12px 6px', backgroundColor: '#eff6ff' }}>
                        <div style={{ fontSize: 10, color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                          {t('override.custom_paid')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>₾</span>
                          <input
                            type="number"
                            min={0}
                            value={paidInputs[target.enrollmentId] ?? ''}
                            onChange={e => {
                              setPaidInputs(prev => ({ ...prev, [target.enrollmentId]: e.target.value }))
                              setPaidConfirmed(prev => ({ ...prev, [target.enrollmentId]: false }))
                            }}
                            style={{ width: 80, padding: '3px 6px', fontSize: 12, border: `1px solid ${paidNeedsConfirm ? '#f97316' : '#93c5fd'}`, borderRadius: 3, outline: 'none', backgroundColor: '#fff' }}
                          />
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>{t('override.recorded')}: ₾{target.ledgerMonth.paid}</span>
                          {paidChanged && (
                            <button
                              onClick={() => {
                                setPaidInputs(prev => ({ ...prev, [target.enrollmentId]: String(paidOriginal) }))
                                setPaidConfirmed(prev => ({ ...prev, [target.enrollmentId]: false }))
                              }}
                              style={{ fontSize: 10, color: '#1e40af', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                            >
                              {t('override.reset_paid')}
                            </button>
                          )}
                        </div>
                        {/* Confirmation for paid */}
                        {paidNeedsConfirm && (
                          <div style={{ marginTop: 8, padding: '8px 10px', backgroundColor: '#eff6ff', border: '1px solid #60a5fa', borderRadius: 4 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 8 }}>
                              {t('override.confirm_paid_question')}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => setPaidConfirmed(prev => ({ ...prev, [target.enrollmentId]: true }))}
                                style={{ padding: '4px 12px', fontSize: 11, fontWeight: 700, borderRadius: 4, border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer' }}
                              >
                                {t('override.confirm_change')}
                              </button>
                              <button
                                onClick={() => {
                                  setPaidInputs(prev => ({ ...prev, [target.enrollmentId]: String(paidOriginal) }))
                                  setPaidConfirmed(prev => ({ ...prev, [target.enrollmentId]: false }))
                                }}
                                style={{ padding: '4px 12px', fontSize: 11, borderRadius: 4, border: '1px solid #d0d7de', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}
                              >
                                {t('override.reset_paid')}
                              </button>
                            </div>
                          </div>
                        )}
                        {paidChanged && !paidNeedsConfirm && (
                          <div style={{ marginTop: 6, fontSize: 10, color: '#15803d', fontWeight: 600 }}>
                            {t('override.confirmed')}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Current status indicator */}
                <div style={{ padding: '8px 12px 0' }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    {t('override.current_status')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span
                      style={{
                        backgroundColor: currentStatusStyle?.bg,
                        color: currentStatusStyle?.text,
                        padding: '2px 8px', borderRadius: 3, fontWeight: 700, fontSize: 11,
                      }}
                    >
                      {t(`status.${target.ledgerMonth.status}`)}
                    </span>
                    {target.ledgerMonth.isOverride && (
                      <span style={{ fontSize: 10, color: '#6b7280', fontStyle: 'italic' }}>
                        ({t('override.manually_overridden')})
                      </span>
                    )}
                  </div>
                </div>

                {/* Radio options */}
                <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {t('override.set_to')}
                  </div>
                  {STATUS_OPTIONS.map(opt => {
                    const isAuto = opt === 'auto'
                    const isPartial = opt === 'partial'
                    const statusColors = isAuto ? null : STATUS_COLORS[opt as MonthOverrideStatus]

                    return (
                      <div key={opt}>
                        <label
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            cursor: 'pointer', fontSize: 12, padding: '3px 4px',
                            borderRadius: 3,
                            backgroundColor: selected === opt ? '#f0f4ff' : 'transparent',
                          }}
                        >
                          <input
                            type="radio"
                            name={`override-${target.enrollmentId}`}
                            value={opt}
                            checked={selected === opt}
                            onChange={() =>
                              setSelections(prev => ({ ...prev, [target.enrollmentId]: opt }))
                            }
                            style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                          />
                          {isAuto ? (
                            <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                              {t('override.auto')}
                            </span>
                          ) : (
                            <span
                              style={{
                                backgroundColor: statusColors?.bg,
                                color: statusColors?.text,
                                padding: '1px 8px', borderRadius: 3, fontWeight: 600, fontSize: 11,
                              }}
                            >
                              {t(`status.${opt}`)}
                            </span>
                          )}
                          {isAuto && selected === opt && target.ledgerMonth.isOverride && (
                            <span style={{ fontSize: 10, color: '#9c6500' }}>{t('override.removes_override')}</span>
                          )}
                        </label>

                        {/* Amount input — shown only when Partial selected AND no standalone paid section */}
                        {isPartial && selected === 'partial' && target.standardFee === undefined && (
                          <div style={{ marginLeft: 24, marginTop: 4, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <label style={{ fontSize: 11, color: '#374151' }}>
                              {t('override.amount_paid')}:
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 12, color: '#6b7280' }}>₾</span>
                              <input
                                type="number"
                                min={0}
                                max={target.ledgerMonth.due}
                                step={1}
                                value={partialAmounts[target.enrollmentId] ?? ''}
                                onChange={e =>
                                  setPartialAmounts(prev => ({ ...prev, [target.enrollmentId]: e.target.value }))
                                }
                                placeholder={`0 – ${target.ledgerMonth.due}`}
                                style={{
                                  width: 80,
                                  padding: '3px 6px',
                                  fontSize: 12,
                                  border: '1px solid #d0d7de',
                                  borderRadius: 3,
                                  outline: 'none',
                                }}
                              />
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                                / ₾{target.ledgerMonth.due} {t('pupil_detail.due')}
                              </span>
                            </div>
                            {partialAmounts[target.enrollmentId] !== undefined &&
                              Number(partialAmounts[target.enrollmentId]) >= target.ledgerMonth.due && (
                              <span style={{ fontSize: 10, color: '#9c0006' }}>
                                {t('override.equals_full_fee')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            padding: '10px 16px',
            borderTop: '1px solid #d0d7de',
            backgroundColor: '#f6f8fa',
            borderRadius: footerBorderRadius,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '5px 14px', fontSize: 12, borderRadius: 4,
              border: '1px solid #d0d7de', backgroundColor: '#fff',
              color: '#374151', cursor: 'pointer',
            }}
          >
            {t('common.cancel')}
          </button>
          {targets.length > 0 && (
            <button
              onClick={handleSave}
              disabled={hasUnconfirmedChanges}
              title={hasUnconfirmedChanges ? t('override.confirm_save_disabled') : undefined}
              style={{
                padding: '5px 14px', fontSize: 12, borderRadius: 4,
                border: 'none',
                backgroundColor: hasUnconfirmedChanges ? '#9ca3af' : '#1d4ed8',
                color: '#fff',
                cursor: hasUnconfirmedChanges ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {t('override.save')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
