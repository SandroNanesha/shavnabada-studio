'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Group, PaymentClassification } from '@/types'
import { useLanguage } from '@/lib/i18n/context'
import { effectiveFee } from '@/lib/ledger'
import { MonthPicker } from './DatePickers'

interface AddEnrollmentModalProps {
  pupilId: string
  groups: Group[]
  classifications: PaymentClassification[]
  defaultGroupId?: string
  onSave: () => void
  onClose: () => void
}

const STANDARD_BASE_FEE = 80

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '5px 8px', fontSize: 12,
  border: '1px solid #d0d7de', borderRadius: 4, outline: 'none', boxSizing: 'border-box',
}

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block',
}

export default function AddEnrollmentModal({ pupilId, groups, classifications, defaultGroupId, onSave, onClose }: AddEnrollmentModalProps) {
  const { t } = useLanguage()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const now = new Date()
  const [groupId, setGroupId] = useState(defaultGroupId ?? '')
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
  const [classificationId, setClassificationId] = useState('')
  const [customFirstMonth, setCustomFirstMonth] = useState(false)
  const [customFirstMonthDue, setCustomFirstMonthDue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const startMonth = startDate.slice(0, 7)

  const previewFee = useMemo(() => {
    const fakeEnrollment = {
      baseFee: STANDARD_BASE_FEE,
      discount: 0,
      classificationId: classificationId || null,
    } as Parameters<typeof effectiveFee>[0]
    return effectiveFee(fakeEnrollment, classifications)
  }, [classificationId, classifications])

  const handleCustomFirstMonthToggle = (checked: boolean) => {
    setCustomFirstMonth(checked)
    if (checked && !customFirstMonthDue) setCustomFirstMonthDue(String(previewFee))
  }

  const handleSave = async () => {
    if (!groupId) { setSaveError(t('groups.group') + ' ' + t('teachers.name_required')); return }
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/pupils/${pupilId}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          startDate,
          classificationId: classificationId || null,
          firstMonthDueOverride: customFirstMonth && customFirstMonthDue
            ? parseFloat(customFirstMonthDue)
            : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSaveError((err as { error?: string }).error ?? t('common.error'))
        return
      }
      onSave()
    } catch {
      setSaveError(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const backdropStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: '#fff', overflowY: 'auto' }
    : { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.4)', overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: 16 }

  const modalBoxStyle: React.CSSProperties = isMobile
    ? { backgroundColor: '#fff', width: '100%', minHeight: '100%' }
    : { backgroundColor: '#fff', border: '1px solid #d0d7de', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: '100%', maxWidth: 420, margin: 'auto' }

  const headerBorderRadius = isMobile ? 0 : '6px 6px 0 0'
  const footerBorderRadius = isMobile ? 0 : '0 0 6px 6px'
  const twoColGrid = isMobile ? '1fr' : '1fr 1fr'

  return (
    <div onClick={e => { if (!isMobile && e.target === e.currentTarget) onClose() }} style={backdropStyle}>
      <div style={modalBoxStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #d0d7de', backgroundColor: '#f6f8fa', borderRadius: headerBorderRadius }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{t('pupils.add_enrollment')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280', lineHeight: 1, padding: '2px 6px' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: twoColGrid, gap: 10 }}>
            <div>
              <label style={lbl}>{t('groups.group')} *</label>
              <select value={groupId} onChange={e => setGroupId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">— {t('teachers.no_group')}</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>{t('pupil_detail.start_date')}</label>
              <MonthPicker value={startDate} onChange={setStartDate} />
            </div>
          </div>

          <div>
            <label style={lbl}>{t('pupil_detail.classification')}</label>
            <select value={classificationId} onChange={e => setClassificationId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">— {t('pupils.standard_rate')} (₾{STANDARD_BASE_FEE})</option>
              {classifications.map(c => {
                const preview = effectiveFee(
                  { baseFee: STANDARD_BASE_FEE, discount: 0, classificationId: c.id } as Parameters<typeof effectiveFee>[0],
                  classifications
                )
                return <option key={c.id} value={c.id}>{c.name} — ₾{preview}/თვე</option>
              })}
            </select>
          </div>

          {groupId && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '8px 10px', backgroundColor: '#fafafa' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={customFirstMonth}
                  onChange={e => handleCustomFirstMonthToggle(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  {t('pupils.custom_first_month')}
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400, marginLeft: 6 }}>({startMonth})</span>
                </span>
              </label>
              {customFirstMonth && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>₾</span>
                  <input
                    type="number" min={0} max={previewFee} step={1}
                    value={customFirstMonthDue}
                    onChange={e => setCustomFirstMonthDue(e.target.value)}
                    style={{ width: 80, padding: '4px 8px', fontSize: 12, border: '1px solid #fcd34d', borderRadius: 4, outline: 'none', backgroundColor: '#fff' }}
                  />
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{t('pupils.custom_first_month_hint')}</span>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4 }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>{t('pupils.monthly_payment')}:</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#166534' }}>₾{previewFee}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #d0d7de', backgroundColor: '#f6f8fa', borderRadius: footerBorderRadius }}>
          {saveError && (
            <div style={{ padding: '6px 16px', fontSize: 11, color: '#dc2626', backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca' }}>{saveError}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 16px' }}>
            <button onClick={onClose} disabled={saving} style={{ padding: '5px 14px', fontSize: 12, borderRadius: 4, border: '1px solid #d0d7de', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}>
              {t('common.cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '5px 14px', fontSize: 12, borderRadius: 4, border: 'none', backgroundColor: saving ? '#93c5fd' : '#1d4ed8', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              {saving ? '…' : t('common.add')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
