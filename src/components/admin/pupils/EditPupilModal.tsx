'use client'

import { useState, useEffect } from 'react'
import type { Pupil, PupilParent } from '@/types'
import { useLanguage } from '@/lib/i18n/context'
import type { PupilBasicEdit } from '@/lib/state/context'
import { DatePicker } from './DatePickers'

interface EditPupilModalProps {
  pupil: Pupil
  currentEdit?: PupilBasicEdit
  onSave: (data: PupilBasicEdit) => void
  onClose: () => void
}

const inputStyle = (err?: boolean): React.CSSProperties => ({
  width: '100%', padding: '5px 8px', fontSize: 12,
  border: `1px solid ${err ? '#f87171' : '#d0d7de'}`,
  borderRadius: 4, outline: 'none', boxSizing: 'border-box',
})

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block',
}

export default function EditPupilModal({ pupil, currentEdit, onSave, onClose }: EditPupilModalProps) {
  const { t } = useLanguage()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const base = currentEdit ?? {
    firstName: pupil.firstName,
    surname: pupil.surname,
    idNumber: pupil.idNumber,
    birthDate: pupil.birthDate,
    parents: pupil.parents,
  }

  const [firstName, setFirstName] = useState(base.firstName)
  const [surname, setSurname] = useState(base.surname)
  const [idNumber, setIdNumber] = useState(base.idNumber)
  const [birthDate, setBirthDate] = useState(base.birthDate)
  const [parents, setParents] = useState<PupilParent[]>(
    base.parents.length > 0 ? base.parents.map(p => ({ ...p })) : [{ name: '', phone: '' }]
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setParentField = (i: number, field: keyof PupilParent, value: string) =>
    setParents(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  const addParent = () => setParents(prev => [...prev, { name: '', phone: '' }])
  const removeParent = (i: number) => setParents(prev => prev.filter((_, idx) => idx !== i))

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = t('teachers.name_required')
    if (!surname.trim()) errs.surname = t('teachers.name_required')
    if (!idNumber.trim()) errs.idNumber = t('pupils.id_required')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({
      firstName: firstName.trim(),
      surname: surname.trim(),
      idNumber: idNumber.trim(),
      birthDate,
      parents: parents.filter(p => p.name.trim() || p.phone.trim()),
    })
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
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{t('pupils.edit_pupil')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280', lineHeight: 1, padding: '2px 6px' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Name */}
          {section(t('table.first_name') + ' / ' + t('table.last_name'))}
          <div style={{ display: 'grid', gridTemplateColumns: twoColGrid, gap: 10 }}>
            <div>
              <label style={lbl}>{t('table.first_name')} *</label>
              <input
                type="text"
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: '' })) }}
                style={inputStyle(!!errors.firstName)}
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
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 16px', borderTop: '1px solid #d0d7de', backgroundColor: '#f6f8fa', borderRadius: footerBorderRadius, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '5px 14px', fontSize: 12, borderRadius: 4, border: '1px solid #d0d7de', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}>
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} style={{ padding: '5px 14px', fontSize: 12, borderRadius: 4, border: 'none', backgroundColor: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
