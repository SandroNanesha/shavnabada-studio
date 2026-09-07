'use client'

import { useState } from 'react'
import type { Enrollment, Group, PaymentClassification, Payment } from '@/types'
import { computeLedger, effectiveFee } from '@/lib/ledger'
import { useLanguage } from '@/lib/i18n/context'
import { translations } from '@/lib/i18n/translations'
import { useAppState } from '@/lib/state/context'

interface EnrollmentCardProps {
  enrollment: Enrollment
  groups: Group[]
  classifications: PaymentClassification[]
  payments: Payment[]
  onCellClick?: (month: string) => void
  onClassificationChange?: (classificationId: string | null) => void
  onEndEnrollment?: (endDate: string) => void
  onRenew?: () => void
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  paid:      { bg: '#c6efce', text: '#276221' },
  partial:   { bg: '#ffeb9c', text: '#9c6500' },
  unpaid:    { bg: '#ffc7ce', text: '#9c0006' },
  confusion: { bg: '#ffcc99', text: '#7f4700' },
  exempt:    { bg: '#deebf7', text: '#2f5496' },
}

const MANUAL_PAID = { bg: '#dbeafe', text: '#1d4ed8' }

const th: React.CSSProperties = { border: '1px solid #d0d7de', padding: '2px 6px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const td: React.CSSProperties = { border: '1px solid #d0d7de', padding: '2px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

const CLASSIFICATION_TYPE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  standard: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  percent:  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  amount:   { bg: '#fefce8', text: '#854d0e', border: '#fef08a' },
  fixed:    { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
}

function formatMonth(month: string, lang: string): string {
  const [year, m] = month.split('-').map(Number)
  const longMonths = (translations[lang as keyof typeof translations] as Record<string, unknown>)
  const names = (longMonths?.months as { long: string[] })?.long
  const name = names?.[m - 1] ?? month
  return `${year} ${name}`
}

export default function EnrollmentCard({
  enrollment, groups, classifications, payments, onCellClick, onClassificationChange, onEndEnrollment, onRenew,
}: EnrollmentCardProps) {
  const { t, lang } = useLanguage()
  const { ledgerComments, setLedgerComment, dueOverrides } = useAppState()
  const [ledgerOpen, setLedgerOpen] = useState(true)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [showEndForm, setShowEndForm] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const [endDateInput, setEndDateInput] = useState(today)

  // Merge DB comments (from enrollment prop) with any unsaved context comments
  const comments = { ...(enrollment.ledgerComments ?? {}), ...(ledgerComments[enrollment.id] ?? {}) }

  const saveComment = async (month: string, comment: string) => {
    setLedgerComment(enrollment.id, month, comment)
    await fetch(`/api/enrollments/${enrollment.id}/comment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, comment }),
    })
  }
  const customDues = dueOverrides[enrollment.id] ?? {}

  const group = groups.find(g => g.id === enrollment.groupId)
  const classification = classifications.find(c => c.id === enrollment.classificationId)
  const fee = effectiveFee(enrollment, classifications)
  const ledger = computeLedger(enrollment, payments, classifications)

  const typeLabel = (type: string) => {
    switch (type) {
      case 'standard': return t('classifications.type_standard')
      case 'percent':  return t('classifications.type_percent')
      case 'amount':   return t('classifications.type_amount')
      case 'fixed':    return t('classifications.type_fixed')
      default: return type
    }
  }

  const classTypeStyle = classification ? CLASSIFICATION_TYPE_STYLE[classification.type] : null

  return (
    <div style={{ border: '1px solid #d0d7de', borderRadius: 4, backgroundColor: '#fff', overflow: 'hidden' }}>

      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 6,
        padding: '8px 12px', backgroundColor: '#f6f8fa', borderBottom: '1px solid #d0d7de',
      }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{group?.name ?? '—'}</span>
          <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8, display: 'inline-block' }}>
            {t('pupil_detail.start_date')}: {enrollment.startDate}
            {enrollment.endDate && ` — ${enrollment.endDate}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
            backgroundColor: enrollment.billingActive ? '#dcfce7' : '#f3f4f6',
            color: enrollment.billingActive ? '#166534' : '#6b7280',
            whiteSpace: 'nowrap',
          }}>
            {enrollment.billingActive ? t('pupil_detail.billing_active') : t('pupil_detail.billing_inactive')}
          </span>
          {onEndEnrollment && !enrollment.endDate && (
            <button
              onClick={() => setShowEndForm(v => !v)}
              title={t('pupils.end_enrollment')}
              style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', padding: '2px 8px', fontSize: 11, color: '#dc2626', fontWeight: 600 }}
            >
              {t('pupils.end_enrollment')}
            </button>
          )}
          {onRenew && enrollment.endDate && (
            <button
              onClick={onRenew}
              style={{ background: 'none', border: '1px solid #86efac', borderRadius: 4, cursor: 'pointer', padding: '2px 8px', fontSize: 11, color: '#166534', fontWeight: 600 }}
            >
              {t('pupils.renew_enrollment')}
            </button>
          )}
        </div>
      </div>

      {/* End enrollment inline form */}
      {showEndForm && (
        <div style={{ padding: '8px 12px', backgroundColor: '#fff7f7', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{t('pupils.end_date')}:</span>
          <input
            type="date"
            value={endDateInput}
            onChange={e => setEndDateInput(e.target.value)}
            style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #fca5a5', borderRadius: 4, outline: 'none' }}
          />
          <button
            onClick={() => { onEndEnrollment(endDateInput); setShowEndForm(false) }}
            style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, border: 'none', backgroundColor: '#dc2626', color: '#fff', cursor: 'pointer' }}
          >
            {t('common.save')}
          </button>
          <button
            onClick={() => setShowEndForm(false)}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, border: '1px solid #d0d7de', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}
          >
            {t('common.cancel')}
          </button>
        </div>
      )}

      <div style={{ padding: '12px 12px 10px' }}>

        {/* Classification banner */}
        <div style={{
          border: `1px solid ${classTypeStyle?.border ?? '#e5e7eb'}`,
          borderRadius: 4,
          backgroundColor: classTypeStyle?.bg ?? '#f9fafb',
          padding: '8px 12px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: classTypeStyle?.text ?? '#6b7280', marginBottom: 3 }}>
              {t('pupil_detail.classification')}
            </div>
            {onClassificationChange ? (
              <select
                value={enrollment.classificationId ?? ''}
                onChange={e => onClassificationChange(e.target.value || null)}
                style={{
                  fontSize: 12, padding: '3px 6px',
                  border: `1px solid ${classTypeStyle?.border ?? '#d0d7de'}`,
                  borderRadius: 4, color: classTypeStyle?.text ?? '#374151',
                  backgroundColor: 'transparent', cursor: 'pointer', outline: 'none', fontWeight: 600,
                }}
              >
                <option value="">— {t('pupil_detail.no_classification')}</option>
                {classifications.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({typeLabel(c.type)})</option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 700, color: classTypeStyle?.text ?? '#374151' }}>
                {classification ? `${classification.name}` : <span style={{ color: '#9ca3af', fontWeight: 400 }}>—</span>}
              </div>
            )}
            {classification && (
              <div style={{ fontSize: 11, color: classTypeStyle?.text ?? '#6b7280', marginTop: 2, opacity: 0.8 }}>
                {typeLabel(classification.type)}
                {classification.type === 'percent' && ` — ${classification.value}% off`}
                {classification.type === 'amount'  && ` — ₾${classification.value} off`}
                {classification.type === 'fixed'   && ` — always ₾${classification.value}`}
                {classification.type === 'standard' && ` — ₾${classification.value}/month`}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: classTypeStyle?.text ?? '#6b7280', marginBottom: 3 }}>
              {t('pupil_detail.effective_fee')}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: classTypeStyle?.text ?? '#111827', lineHeight: 1 }}>
              ₾{fee}
            </div>
            {enrollment.baseFee !== fee && (
              <div style={{ fontSize: 11, color: classTypeStyle?.text ?? '#6b7280', opacity: 0.7, marginTop: 2 }}>
                base ₾{enrollment.baseFee}
              </div>
            )}
          </div>
        </div>

        {/* Ledger toggle */}
        <button
          onClick={() => setLedgerOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 600, color: '#6b7280',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            padding: '4px 0', marginBottom: ledgerOpen ? 8 : 0,
          }}
        >
          <span style={{ fontSize: 10 }}>{ledgerOpen ? '▾' : '▸'}</span>
          {t('pupil_detail.month')} — {t('pupil_detail.status')} ({ledger.length})
        </button>

        {ledgerOpen && (
          <div style={{ marginBottom: 4, overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <table style={{ borderCollapse: 'collapse', fontSize: 11, tableLayout: 'auto', width: '100%', minWidth: 420 }}>
              <thead>
                <tr style={{ backgroundColor: '#f6f8fa' }}>
                  <th style={th}>{t('pupil_detail.month')}</th>
                  <th style={{ ...th, textAlign: 'right' }}>{t('pupil_detail.due')}</th>
                  <th style={{ ...th, textAlign: 'right' }}>{t('pupil_detail.paid')}</th>
                  <th style={{ ...th, textAlign: 'center' }}>{t('pupil_detail.status')}</th>
                  <th style={{ ...th, width: '100%' }}>{t('pupil_detail.comment')}</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map(lm => {
                  const s = (lm.status === 'paid' && lm.isOverride) ? MANUAL_PAID : (STATUS_STYLES[lm.status] ?? { bg: '#fff', text: '#374151' })
                  const isEditingThis = editingComment === lm.month
                  return (
                    <tr
                      key={lm.month}
                      onClick={onCellClick ? () => onCellClick(lm.month) : undefined}
                      style={{ cursor: onCellClick ? 'pointer' : 'default' }}
                      title={onCellClick ? t('pupil_detail.override') : undefined}
                    >
                      <td style={{ ...td, color: '#374151' }}>
                        {formatMonth(lm.month, lang)}
                      </td>
                      <td style={{ ...td, textAlign: 'right', color: customDues[lm.month] !== undefined ? '#854d0e' : '#374151' }}>
                        {customDues[lm.month] !== undefined && (
                          <span style={{ fontSize: 9, color: '#92400e', fontWeight: 700, marginRight: 3 }}>✎</span>
                        )}
                        {lm.due} ₾
                      </td>
                      <td style={{ ...td, textAlign: 'right', color: '#374151' }}>{lm.paid} ₾</td>
                      <td style={{ ...td, textAlign: 'center', backgroundColor: s.bg, color: s.text, fontWeight: 600 }}>
                        {t(`status.${lm.status}`)}
                      </td>
                      <td
                        style={{ ...td, padding: 0 }}
                        onClick={e => {
                          e.stopPropagation()
                          if (!isEditingThis) setEditingComment(lm.month)
                        }}
                      >
                        {isEditingThis ? (
                          <input
                            autoFocus
                            type="text"
                            defaultValue={comments[lm.month] ?? ''}
                            onChange={e => setLedgerComment(enrollment.id, lm.month, e.target.value)}
                            onBlur={e => { saveComment(lm.month, e.target.value); setEditingComment(null) }}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === 'Escape') {
                                saveComment(lm.month, (e.target as HTMLInputElement).value)
                                setEditingComment(null)
                              }
                            }}
                            style={{
                              width: '100%', padding: '2px 6px', fontSize: 11,
                              border: 'none', outline: '2px solid #3b82f6',
                              backgroundColor: '#eff6ff', boxSizing: 'border-box',
                            }}
                          />
                        ) : (
                          <div style={{ padding: '2px 6px', minHeight: 20, cursor: 'text', color: comments[lm.month] ? '#374151' : '#d1d5db' }}>
                            {comments[lm.month] || '…'}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
