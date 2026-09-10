'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/context'
import type { ApplicationFormField } from '@/types'

interface FormDef {
  id: string
  title: string
  fields: ApplicationFormField[]
  disabledPredefined: string[]
}

export default function ApplySlugPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t, lang, setLang } = useLanguage()

  const [formDef, setFormDef] = useState<FormDef | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formLogo, setFormLogo] = useState('')

  const [firstName, setFirstName] = useState('')
  const [surname, setSurname] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [parents, setParents] = useState([{ name: '', phone: '' }])
  const [customValues, setCustomValues] = useState<Record<string, string>>({})

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!slug) return
    fetch('/api/settings')
      .then(r => r.json())
      .then((s: { formLogo?: string }) => { if (s.formLogo) setFormLogo(s.formLogo) })
      .catch(() => {})
    fetch(`/api/apply/${slug}`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); return null }
        return res.json() as Promise<FormDef>
      })
      .then(data => {
        if (data) {
          setFormDef(data)
          const init: Record<string, string> = {}
          data.fields.forEach(f => { init[f.id] = '' })
          setCustomValues(init)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  const addParent = () => setParents(prev => [...prev, { name: '', phone: '' }])
  const removeParent = (i: number) => setParents(prev => prev.filter((_, idx) => idx !== i))
  const updateParent = (i: number, field: 'name' | 'phone', value: string) =>
    setParents(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`/api/apply/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          surname,
          birthDate,
          idNumber,
          parents: parents.filter(p => p.name.trim() || p.phone.trim()),
          customValues: formDef
            ? formDef.fields.map(f => ({ label: f.label, value: customValues[f.id] ?? '' }))
            : [],
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        setSubmitError(err.error ?? t('common.error'))
        return
      }
      setSubmitted(true)
    } catch {
      setSubmitError(t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 4,
  }

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '2px solid #e5e7eb',
  }

  const langToggle = (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {(['en', 'ka'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              padding: '4px 12px',
              fontSize: 12,
              borderRadius: 4,
              border: '1px solid #d1d5db',
              backgroundColor: lang === l ? '#1e293b' : '#fff',
              color: lang === l ? '#fff' : '#6b7280',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <p style={{ fontSize: 14, color: '#6b7280' }}>{t('common.loading')}</p>
      </div>
    )
  }

  if (notFound || !formDef) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            {lang === 'ka' ? 'ფორმა ვერ მოიძებნა' : 'Form not found'}
          </p>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            {lang === 'ka' ? 'გთხოვთ შეამოწმოთ ბმული.' : 'Please check the link.'}
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: '40px 48px', maxWidth: 480, textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
            {lang === 'ka' ? 'გმადლობთ!' : 'Thank you!'}
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
            {t('apply.success')}
          </p>
        </div>
      </div>
    )
  }

  const renderCustomField = (field: ApplicationFormField) => {
    const value = customValues[field.id] ?? ''
    const onChange = (v: string) => setCustomValues(prev => ({ ...prev, [field.id]: v }))

    if (field.type === 'textarea') {
      return (
        <textarea
          required={field.required}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ ...inputStyle, minHeight: 72, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder={field.label}
        />
      )
    }

    const inputType = field.type === 'phone' ? 'tel' : field.type === 'date' ? 'date' : 'text'
    return (
      <input
        type={inputType}
        required={field.required}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
        placeholder={field.label}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '32px 16px' }}>
      {langToggle}

      <div style={{ maxWidth: 640, margin: '0 auto', backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#1e293b', color: '#fff', padding: '28px 36px' }}>
          {formLogo && (
            <img src={formLogo} alt="logo" style={{ height: 48, maxWidth: 160, objectFit: 'contain', marginBottom: 16, display: 'block' }} />
          )}
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            {formDef.title}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>
            {t('apply.subtitle')}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px 36px' }}>
          {/* Pupil Info */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={sectionHeaderStyle}>{t('apply.pupil_info')}</h2>
            {((!formDef.disabledPredefined.includes('firstName')) || (!formDef.disabledPredefined.includes('lastName'))) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {!formDef.disabledPredefined.includes('firstName') && (
                  <div>
                    <label style={labelStyle}>{t('apply.first_name')} <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} placeholder={t('apply.first_name')} />
                  </div>
                )}
                {!formDef.disabledPredefined.includes('lastName') && (
                  <div>
                    <label style={labelStyle}>{t('apply.last_name')} <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={surname} onChange={e => setSurname(e.target.value)} style={inputStyle} placeholder={t('apply.last_name')} />
                  </div>
                )}
              </div>
            )}
            {((!formDef.disabledPredefined.includes('birthDate')) || (!formDef.disabledPredefined.includes('idNumber'))) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {!formDef.disabledPredefined.includes('birthDate') && (
                  <div>
                    <label style={labelStyle}>{t('apply.birth_date')} <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="date" required value={birthDate} onChange={e => setBirthDate(e.target.value)} style={inputStyle} />
                  </div>
                )}
                {!formDef.disabledPredefined.includes('idNumber') && (
                  <div>
                    <label style={labelStyle}>{t('pupils.id_number')} <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={idNumber} onChange={e => setIdNumber(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder={t('pupils.id_number_placeholder')} />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Parents */}
          {!formDef.disabledPredefined.includes('parents') && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={sectionHeaderStyle}>{t('apply.parents_section')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {parents.map((parent, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, backgroundColor: '#f9fafb', position: 'relative' }}>
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => removeParent(i)}
                      style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                    >
                      {t('apply.remove_parent')}
                    </button>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>{t('apply.parent_name')} {i === 0 && <span style={{ color: '#ef4444' }}>*</span>}</label>
                      <input type="text" required={i === 0} value={parent.name} onChange={e => updateParent(i, 'name', e.target.value)} style={inputStyle} placeholder={t('apply.parent_name')} />
                    </div>
                    <div>
                      <label style={labelStyle}>{t('apply.parent_phone')} {i === 0 && <span style={{ color: '#ef4444' }}>*</span>}</label>
                      <input type="tel" required={i === 0} value={parent.phone} onChange={e => updateParent(i, 'phone', e.target.value)} style={inputStyle} placeholder="+995 5XX XXX XXX" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addParent}
              style={{ marginTop: 12, padding: '8px 16px', fontSize: 12, border: '1px dashed #d1d5db', borderRadius: 6, backgroundColor: 'transparent', color: '#6b7280', cursor: 'pointer', fontWeight: 500 }}
            >
              + {t('apply.add_parent')}
            </button>
          </section>
          )}

          {/* Custom fields */}
          {formDef.fields.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={sectionHeaderStyle}>{t('apply.additional_info')}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {formDef.fields.map(field => (
                  <div key={field.id}>
                    <label style={labelStyle}>
                      {field.label}{' '}
                      {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    {renderCustomField(field)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {submitError && (
            <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: '#dc2626' }}>
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ width: '100%', padding: 14, backgroundColor: submitting ? '#94a3b8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background-color 0.15s', letterSpacing: '0.01em' }}
          >
            {submitting ? t('apply.submitting') : t('apply.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
