'use client'

import { useState } from 'react'
import { applicationFormConfig } from '@/lib/mock-data'
import { useLanguage } from '@/lib/i18n/context'
import type { PupilParent } from '@/types'

export default function ApplyPage() {
  const { t, lang, setLang } = useLanguage()

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [parents, setParents] = useState<PupilParent[]>([{ name: '', phone: '' }])
  const [customValues, setCustomValues] = useState<Record<string, string>>(
    Object.fromEntries(applicationFormConfig.customFields.map(f => [f.id, '']))
  )
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const addParent = () => {
    if (parents.length < applicationFormConfig.maxParents) {
      setParents(prev => [...prev, { name: '', phone: '' }])
    }
  }

  const removeParent = (index: number) => {
    setParents(prev => prev.filter((_, i) => i !== index))
  }

  const updateParent = (index: number, field: keyof PupilParent, value: string) => {
    setParents(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    // Simulate submission delay
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 1200)
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box' as const,
    backgroundColor: '#fff',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 4,
  }

  const sectionHeaderStyle = {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '2px solid #e5e7eb',
  }

  if (submitted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 10,
            padding: '40px 48px',
            maxWidth: 480,
            textAlign: 'center',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
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

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '32px 16px',
      }}
    >
      {/* Language toggle */}
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setLang('en')}
            style={{
              padding: '4px 12px',
              fontSize: 12,
              borderRadius: 4,
              border: '1px solid #d1d5db',
              backgroundColor: lang === 'en' ? '#1e293b' : '#fff',
              color: lang === 'en' ? '#fff' : '#6b7280',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            EN
          </button>
          <button
            onClick={() => setLang('ka')}
            style={{
              padding: '4px 12px',
              fontSize: 12,
              borderRadius: 4,
              border: '1px solid #d1d5db',
              backgroundColor: lang === 'ka' ? '#1e293b' : '#fff',
              color: lang === 'ka' ? '#fff' : '#6b7280',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            KA
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          backgroundColor: '#fff',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#1e293b',
            color: '#fff',
            padding: '28px 36px',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            {t('apply.title')}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>
            {t('apply.subtitle')}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px 36px' }}>
          {/* Section 1: Pupil Info */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={sectionHeaderStyle}>{t('apply.pupil_info')}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>
                  {t('apply.first_name')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  style={inputStyle}
                  placeholder={t('apply.first_name')}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  {t('apply.last_name')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  style={inputStyle}
                  placeholder={t('apply.last_name')}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                {t('apply.birth_date')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                style={{ ...inputStyle, maxWidth: 240 }}
              />
            </div>
          </section>

          {/* Section 2: Parents */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={sectionHeaderStyle}>{t('apply.parents_section')}</h2>

            <div className="space-y-4">
              {parents.map((parent, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    position: 'relative',
                  }}
                >
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => removeParent(i)}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 12,
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {t('apply.remove_parent')}
                    </button>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>
                        {t('apply.parent_name')} {i === 0 && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <input
                        type="text"
                        required={i === 0}
                        value={parent.name}
                        onChange={e => updateParent(i, 'name', e.target.value)}
                        style={inputStyle}
                        placeholder={t('apply.parent_name')}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>
                        {t('apply.parent_phone')} {i === 0 && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <input
                        type="tel"
                        required={i === 0}
                        value={parent.phone}
                        onChange={e => updateParent(i, 'phone', e.target.value)}
                        style={inputStyle}
                        placeholder="+995 5XX XXX XXX"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {parents.length < applicationFormConfig.maxParents && (
              <button
                type="button"
                onClick={addParent}
                style={{
                  marginTop: 12,
                  padding: '8px 16px',
                  fontSize: 12,
                  border: '1px dashed #d1d5db',
                  borderRadius: 6,
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                + {t('apply.add_parent')}
              </button>
            )}
          </section>

          {/* Section 3: Custom fields */}
          {applicationFormConfig.customFields.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={sectionHeaderStyle}>{t('apply.additional_info')}</h2>

              <div className="space-y-4">
                {applicationFormConfig.customFields.map(field => (
                  <div key={field.id}>
                    <label style={labelStyle}>
                      {field.label}{' '}
                      {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <textarea
                      required={field.required}
                      value={customValues[field.id] ?? ''}
                      onChange={e => setCustomValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      style={{
                        ...inputStyle,
                        minHeight: 72,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                      placeholder={field.label}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Document upload */}
          {applicationFormConfig.requireDocument && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={sectionHeaderStyle}>{t('apply.document_upload')}</h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                {t('apply.document_hint')}
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setDocumentFile(e.target.files?.[0] ?? null)}
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: '#374151',
                }}
              />
              {documentFile && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#166534', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: 4, display: 'inline-block' }}>
                  {documentFile.name}
                </div>
              )}
            </section>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: submitting ? '#94a3b8' : '#1e293b',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              letterSpacing: '0.01em',
            }}
          >
            {submitting ? t('apply.submitting') : t('apply.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
