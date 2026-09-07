'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Pupil, Group, PaymentClassification, PupilParent } from '@/types'
import { useLanguage } from '@/lib/i18n/context'
import { effectiveFee } from '@/lib/ledger'
import { DatePicker, MonthPicker } from './DatePickers'

interface AddPupilModalProps {
  groups: Group[]
  classifications: PaymentClassification[]
  onSave: (pupil: Pupil) => void
  onClose: () => void
}

const STANDARD_BASE_FEE = 80

const inputStyle = (err?: boolean): React.CSSProperties => ({
  width: '100%', padding: '5px 8px', fontSize: 12,
  border: `1px solid ${err ? '#f87171' : '#d0d7de'}`,
  borderRadius: 4, outline: 'none', boxSizing: 'border-box',
})

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block',
}

export default function AddPupilModal({ groups, classifications, onSave, onClose }: AddPupilModalProps) {
  const { t } = useLanguage()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [firstName, setFirstName] = useState('')
  const [surname, setSurname] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [parents, setParents] = useState<PupilParent[]>([{ name: '', phone: '' }])
  const [groupId, setGroupId] = useState('')
  const now = new Date()
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
  const [classificationId, setClassificationId] = useState('')
  const [customFirstMonth, setCustomFirstMonth] = useState(false)
  const [customFirstMonthDue, setCustomFirstMonthDue] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // YYYY-MM of the selected start date
  const startMonth = startDate.slice(0, 7)

  const setParentField = (i: number, field: keyof PupilParent, value: string) =>
    setParents(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  const addParent = () => setParents(prev => [...prev, { name: '', phone: '' }])
  const removeParent = (i: number) => setParents(prev => prev.filter((_, idx) => idx !== i))

  const previewFee = useMemo(() => {
    const fakeEnrollment = {
      baseFee: STANDARD_BASE_FEE,
      discount: 0,
      classificationId: classificationId || null,
    } as Parameters<typeof effectiveFee>[0]
    return effectiveFee(fakeEnrollment, classifications)
  }, [classificationId, classifications])

  // When checkbox is first ticked, pre-fill with the effective fee
  const handleCustomFirstMonthToggle = (checked: boolean) => {
    setCustomFirstMonth(checked)
    if (checked && !customFirstMonthDue) setCustomFirstMonthDue(String(previewFee))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = t('teachers.name_required')
    if (!surname.trim()) errs.surname = t('teachers.name_required')
    if (!idNumber.trim()) errs.idNumber = t('pupils.id_required')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/pupils', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          surname: surname.trim(),
          idNumber: idNumber.trim(),
          birthDate,
          parents: parents.filter(p => p.name.trim() || p.phone.trim()),
          enrollment: groupId ? {
            groupId,
            startDate,
            classificationId: classificationId || null,
            firstMonthDueOverride: customFirstMonth && customFirstMonthDue
              ? parseFloat(customFirstMonthDue)
              : undefined,
          } : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSaveError((err as { error?: string }).error ?? t('common.error'))
        return
      }
      const pupil = await res.json() as Pupil
      onSave(pupil)
    } catch {
      setSaveError(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const section = (title: string) => (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 8, marginTop: 4 }}>
      {title}
    </div>
  )

  const modalBoxStyle: React.CSSProperties = isMobile
    ? { backgroundColor: '#fff', width: '100%', minHeight: '100%' }
    : {
        backgroundColor: '#fff',
        border: '1px solid #d0d7de',
        borderRadius: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        width: '100%',
        maxWidth: 500,
        margin: 'auto',
      }

  const backdropStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: '#fff', overflowY: 'auto' }
    : { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.4)', overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: 16 }

  const headerBorderRadius = isMobile ? 0 : '6px 6px 0 0'
  const footerBorderRadius = isMobile ? 0 : '0 0 6px 6px'
  const twoColGrid = isMobile ? '1fr' : '1fr 1fr'

  return (
    <div
      onClick={e => { if (!isMobile && e.target === e.currentTarget) onClose() }}
      style={backdropStyle}
    >
      <div style={modalBoxStyle}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #d0d7de', backgroundColor: '#f6f8fa', borderRadius: headerBorderRadius, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{t('pupils.add_pupil')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280', lineHeight: 1, padding: '2px 6px' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Name row */}
          {section(t('table.first_name') + ' / ' + t('table.last_name'))}
          <div style={{ display: 'grid', gridTemplateColumns: twoColGrid, gap: 10 }}>
            <div>
              <label style={lbl}>{t('table.first_name')} *</label>
              <input
                type="text"
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: '' })) }}
                style={inputStyle(!!errors.firstName)}
                placeholder="მაგ. მარიამ / e.g. Mariam"
                autoFocus
              />
              {errors.firstName && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>{errors.firstName}</div>}
            </div>
            <div>
              <label style={lbl}>{t('table.last_name')} *</label>
              <input
                type="text"
                value={surname}
                onChange={e => { setSurname(e.target.value); setErrors(p => ({ ...p, surname: '' })) }}
                style={inputStyle(!!errors.surname)}
                placeholder="მაგ. გელაშვილი / e.g. Gelashvili"
              />
              {errors.surname && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>{errors.surname}</div>}
            </div>
          </div>

          {/* ID + DOB */}
          <div style={{ display: 'grid', gridTemplateColumns: twoColGrid, gap: 10 }}>
            <div>
              <label style={lbl}>{t('pupils.id_number')} *</label>
              <input
                type="text"
                value={idNumber}
                onChange={e => { setIdNumber(e.target.value); setErrors(p => ({ ...p, idNumber: '' })) }}
                style={{ ...inputStyle(!!errors.idNumber), fontFamily: 'monospace' }}
                placeholder={t('pupils.id_number_placeholder')}
              />
              {errors.idNumber && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>{errors.idNumber}</div>}
            </div>
            <div>
              <label style={lbl}>{t('applications.birth_date')}</label>
              <DatePicker value={birthDate} onChange={setBirthDate} />
            </div>
          </div>

          {/* Parents */}
          {section(t('pupils.parents_section'))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {parents.map((p, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '10px 12px', position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => removeParent(i)}
                  title={t('pupil_detail.remove_parent')}
                  style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                  </svg>
                </button>
                <div style={{ paddingRight: 20 }}>
                  <label style={lbl}>{t('pupil_detail.parent_name')}</label>
                  <input
                    type="text"
                    value={p.name}
                    onChange={e => setParentField(i, 'name', e.target.value)}
                    style={inputStyle()}
                  />
                </div>
                <div>
                  <label style={lbl}>{t('pupil_detail.parent_phone')}</label>
                  <input
                    type="tel"
                    value={p.phone}
                    onChange={e => setParentField(i, 'phone', e.target.value)}
                    style={{ ...inputStyle(), fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addParent}
              style={{ alignSelf: 'flex-start', fontSize: 11, color: '#1d4ed8', background: 'none', border: '1px dashed #93c5fd', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}
            >
              {t('pupil_detail.add_parent')}
            </button>
          </div>

          {/* Enrollment */}
          {section(t('pupils.enrollment_optional'))}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: twoColGrid, gap: 10 }}>
              <div>
                <label style={lbl}>{t('groups.group')}</label>
                <select value={groupId} onChange={e => setGroupId(e.target.value)} style={{ ...inputStyle(), cursor: 'pointer' }}>
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
              <select
                value={classificationId}
                onChange={e => setClassificationId(e.target.value)}
                style={{ ...inputStyle(), cursor: 'pointer' }}
              >
                <option value="">— {t('pupils.standard_rate')} (₾{STANDARD_BASE_FEE})</option>
                {classifications.map(c => {
                  const preview = effectiveFee(
                    { baseFee: STANDARD_BASE_FEE, discount: 0, classificationId: c.id } as Parameters<typeof effectiveFee>[0],
                    classifications
                  )
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} — ₾{preview}/თვე
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Custom first month due */}
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
                    <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400, marginLeft: 6 }}>
                      ({startMonth})
                    </span>
                  </span>
                </label>
                {customFirstMonth && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>₾</span>
                    <input
                      type="number"
                      min={0}
                      max={previewFee}
                      step={1}
                      value={customFirstMonthDue}
                      onChange={e => setCustomFirstMonthDue(e.target.value)}
                      style={{ width: 80, padding: '4px 8px', fontSize: 12, border: '1px solid #fcd34d', borderRadius: 4, outline: 'none', backgroundColor: '#fff' }}
                    />
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      {t('pupils.custom_first_month_hint')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{t('pupils.monthly_payment')}:</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#166534' }}>₾{previewFee}</span>
              {classificationId && (
                <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 4 }}>
                  ({t('pupils.standard_rate')}: ₾{STANDARD_BASE_FEE})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #d0d7de', backgroundColor: '#f6f8fa', borderRadius: footerBorderRadius, flexShrink: 0 }}>
          {saveError && (
            <div style={{ padding: '6px 16px', fontSize: 11, color: '#dc2626', backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
              {saveError}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 16px' }}>
            <button onClick={onClose} disabled={saving} style={{ padding: '5px 14px', fontSize: 12, borderRadius: 4, border: '1px solid #d0d7de', backgroundColor: '#fff', color: '#374151', cursor: saving ? 'not-allowed' : 'pointer' }}>
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
