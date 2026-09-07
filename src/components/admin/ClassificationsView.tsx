'use client'

import { useState, useEffect } from 'react'
import type { PaymentClassification, PaymentClassificationType } from '@/types'
import { useLanguage } from '@/lib/i18n/context'

interface ClassificationsViewProps {
  initialClassifications: PaymentClassification[]
}

interface ModalState {
  mode: 'add' | 'edit'
  cls: PaymentClassification
}

const EMPTY: PaymentClassification = { id: '', name: '', type: 'standard', value: 0 }

function formatValue(cls: PaymentClassification): string {
  return cls.type === 'percent' ? `${cls.value}%` : `₾${cls.value}`
}

export default function ClassificationsView({ initialClassifications }: ClassificationsViewProps) {
  const { t } = useLanguage()
  const [classifications, setClassifications] = useState(initialClassifications)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [errors, setErrors] = useState<{ name?: string; value?: string }>({})
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const TYPE_META: Record<PaymentClassificationType, { label: string; valueLabel: string; description: string }> = {
    standard: {
      label: t('classifications.type_label_standard'),
      valueLabel: t('classifications.value_label_standard'),
      description: t('classifications.desc_standard'),
    },
    percent: {
      label: t('classifications.type_label_percent'),
      valueLabel: t('classifications.value_label_percent'),
      description: t('classifications.desc_percent'),
    },
    amount: {
      label: t('classifications.type_label_amount'),
      valueLabel: t('classifications.value_label_amount'),
      description: t('classifications.desc_amount'),
    },
    fixed: {
      label: t('classifications.type_label_fixed'),
      valueLabel: t('classifications.value_label_fixed'),
      description: t('classifications.desc_fixed'),
    },
  }

  const openAdd = () => {
    setErrors({})
    setModal({ mode: 'add', cls: { ...EMPTY, id: `cls-${Date.now()}` } })
  }

  const openEdit = (cls: PaymentClassification) => {
    setErrors({})
    setModal({ mode: 'edit', cls: { ...cls } })
  }

  const closeModal = () => setModal(null)

  const setField = <K extends keyof PaymentClassification>(key: K, value: PaymentClassification[K]) => {
    if (!modal) return
    setModal(prev => prev ? { ...prev, cls: { ...prev.cls, [key]: value } } : prev)
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = (cls: PaymentClassification): boolean => {
    const errs: { name?: string; value?: string } = {}
    if (!cls.name.trim()) errs.name = t('classifications.name_required')
    if (isNaN(cls.value) || cls.value < 0) errs.value = t('classifications.value_positive')
    if (cls.type === 'percent' && cls.value > 100) errs.value = t('classifications.value_percent_max')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!modal) return
    if (!validate(modal.cls)) return

    if (modal.mode === 'add') {
      setClassifications(prev => [...prev, modal.cls])
    } else {
      setClassifications(prev => prev.map(c => c.id === modal.cls.id ? modal.cls : c))
    }
    closeModal()
  }

  const handleDelete = (id: string) => {
    setClassifications(prev => prev.filter(c => c.id !== id))
    closeModal()
  }

  const th: React.CSSProperties = {
    border: '1px solid #d0d7de', padding: '7px 12px',
    textAlign: 'left', fontWeight: 600, color: '#374151', backgroundColor: '#f6f8fa',
    whiteSpace: 'nowrap',
  }
  const td: React.CSSProperties = {
    border: '1px solid #d0d7de', padding: '7px 12px',
  }

  const modalBoxStyle: React.CSSProperties = isMobile
    ? { backgroundColor: '#fff', width: '100%', height: '100%', maxHeight: '100dvh', overflow: 'auto', display: 'flex', flexDirection: 'column' }
    : { backgroundColor: '#fff', border: '1px solid #d0d7de', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column' }

  const backdropStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: '#fff', display: 'flex', alignItems: 'stretch', justifyContent: 'stretch' }
    : { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }

  const borderRadius0 = isMobile ? 0 : undefined

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
          {t('classifications.title')}
        </h1>
        <button onClick={openAdd} style={{
          backgroundColor: '#1e293b', color: '#fff', border: 'none',
          borderRadius: 4, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 500,
          whiteSpace: 'nowrap',
        }}>
          {t('classifications.add_btn')}
        </button>
      </div>

      {/* Horizontally scrollable table container */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12, backgroundColor: '#fff', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={th}>{t('classifications.name')}</th>
              <th style={th}>{t('classifications.type')}</th>
              <th style={{ ...th, textAlign: 'right' }}>{t('classifications.value')}</th>
              <th style={th}>{t('classifications.how_computed')}</th>
              <th style={{ ...th, width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {classifications.map(cls => {
              const meta = TYPE_META[cls.type]
              return (
                <tr key={cls.id} style={{ backgroundColor: '#fff' }}>
                  <td style={{ ...td, fontWeight: 600, color: '#111827' }}>{cls.name}</td>
                  <td style={td}>
                    <span style={{
                      backgroundColor: '#f3f4f6', color: '#374151',
                      padding: '1px 7px', borderRadius: 10, fontSize: 11,
                      fontWeight: 600, fontFamily: 'monospace',
                    }}>
                      {cls.type}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', color: '#111827', fontWeight: 700 }}>
                    {formatValue(cls)}
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight: 600, color: '#374151', marginBottom: 1 }}>{meta.label}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{meta.description}</div>
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button
                      onClick={() => openEdit(cls)}
                      style={{
                        color: '#1d4ed8', background: 'none', border: 'none',
                        cursor: 'pointer', fontSize: 11, padding: 0,
                      }}
                    >
                      {t('common.edit')}
                    </button>
                  </td>
                </tr>
              )
            })}
            {classifications.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                  {t('classifications.no_data')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div
          onClick={e => { if (!isMobile && e.target === e.currentTarget) closeModal() }}
          style={backdropStyle}
        >
          <div style={modalBoxStyle}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid #d0d7de', backgroundColor: '#f6f8fa',
              borderRadius: isMobile ? 0 : '6px 6px 0 0',
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>
                {modal.mode === 'add' ? t('classifications.add_title') : t('classifications.edit_title')}
              </div>
              <button onClick={closeModal} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 18, color: '#6b7280', lineHeight: 1, padding: '2px 6px',
              }}>×</button>
            </div>

            {/* Body */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflow: 'auto' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  {t('classifications.name')}
                </label>
                <input
                  type="text"
                  value={modal.cls.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder={t('classifications.name_placeholder')}
                  style={{
                    width: '100%', padding: '6px 10px', fontSize: 12,
                    border: `1px solid ${errors.name ? '#f87171' : '#d0d7de'}`, borderRadius: 4,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {errors.name && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors.name}</div>}
              </div>

              {/* Type */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  {t('classifications.type')}
                </label>
                <select
                  value={modal.cls.type}
                  onChange={e => setField('type', e.target.value as PaymentClassificationType)}
                  style={{
                    width: '100%', padding: '6px 10px', fontSize: 12,
                    border: '1px solid #d0d7de', borderRadius: 4, outline: 'none',
                    backgroundColor: '#fff', cursor: 'pointer',
                  }}
                >
                  {(Object.keys(TYPE_META) as PaymentClassificationType[]).map(tp => (
                    <option key={tp} value={tp}>{TYPE_META[tp].label}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                  {TYPE_META[modal.cls.type].description}
                </div>
              </div>

              {/* Value */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  {TYPE_META[modal.cls.type].valueLabel}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    min={0}
                    max={modal.cls.type === 'percent' ? 100 : undefined}
                    step={modal.cls.type === 'percent' ? 1 : 0.01}
                    value={modal.cls.value}
                    onChange={e => setField('value', parseFloat(e.target.value) || 0)}
                    style={{
                      width: 100, padding: '6px 10px', fontSize: 12,
                      border: `1px solid ${errors.value ? '#f87171' : '#d0d7de'}`, borderRadius: 4,
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    {modal.cls.type === 'percent' ? '%' : '₾'}
                  </span>
                  {modal.cls.type !== 'percent' && modal.cls.value > 0 && (
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      = {formatValue(modal.cls)}
                    </span>
                  )}
                </div>
                {errors.value && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors.value}</div>}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 16px', borderTop: '1px solid #d0d7de',
              backgroundColor: '#f6f8fa',
              borderRadius: isMobile ? 0 : '0 0 6px 6px',
              flexShrink: 0,
            }}>
              <div>
                {modal.mode === 'edit' && (
                  <button
                    onClick={() => handleDelete(modal.cls.id)}
                    style={{
                      padding: '5px 12px', fontSize: 12, borderRadius: 4,
                      border: '1px solid #fca5a5', backgroundColor: '#fff',
                      color: '#dc2626', cursor: 'pointer',
                    }}
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={closeModal} style={{
                  padding: '5px 14px', fontSize: 12, borderRadius: 4,
                  border: '1px solid #d0d7de', backgroundColor: '#fff',
                  color: '#374151', cursor: 'pointer',
                }}>
                  {t('common.cancel')}
                </button>
                <button onClick={handleSave} style={{
                  padding: '5px 14px', fontSize: 12, borderRadius: 4,
                  border: 'none', backgroundColor: '#1d4ed8',
                  color: '#fff', cursor: 'pointer', fontWeight: 600,
                }}>
                  {modal.mode === 'add' ? t('common.add') : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
