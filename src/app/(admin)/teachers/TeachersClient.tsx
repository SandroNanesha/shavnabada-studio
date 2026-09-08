'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/context'
import type { Teacher, TeacherRole, Group } from '@/types'

const EMPTY_TEACHER: Omit<Teacher, 'id'> = {
  name: '',
  contact: '',
  role: 'Principal',
  groupIds: [],
}

interface ModalState {
  mode: 'add' | 'edit'
  teacher: Teacher
}

interface TeachersClientProps {
  initialTeachers: Teacher[]
  groups: Group[]
}

export default function TeachersClient({ initialTeachers, groups }: TeachersClientProps) {
  const { t } = useLanguage()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [errors, setErrors] = useState<{ name?: string; contact?: string }>({})

  const groupMap = new Map(groups.map(g => [g.id, g.name]))

  const roleLabel = (role: string) =>
    role === 'Principal' ? t('teachers.role_principal') : t('teachers.role_assistant')

  const openAdd = () => {
    setErrors({})
    setModal({ mode: 'add', teacher: { id: `tch-${Date.now()}`, ...EMPTY_TEACHER } })
  }

  const openEdit = (teacher: Teacher) => {
    setErrors({})
    setModal({ mode: 'edit', teacher: { ...teacher } })
  }

  const closeModal = () => setModal(null)

  const setField = <K extends keyof Teacher>(key: K, value: Teacher[K]) => {
    setModal(prev => prev ? { ...prev, teacher: { ...prev.teacher, [key]: value } } : prev)
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = (teacher: Teacher): boolean => {
    const errs: { name?: string; contact?: string } = {}
    if (!teacher.name.trim()) errs.name = t('teachers.name_required')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!modal) return
    if (!validate(modal.teacher)) return
    if (modal.mode === 'add') {
      setTeachers(prev => [...prev, modal.teacher])
    } else {
      setTeachers(prev => prev.map(t => t.id === modal.teacher.id ? modal.teacher : t))
    }
    closeModal()
  }

  const handleDelete = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id))
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
  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', padding: '6px 10px', fontSize: 12,
    border: `1px solid ${hasError ? '#f87171' : '#d0d7de'}`,
    borderRadius: 4, outline: 'none', boxSizing: 'border-box',
  })

  const backdropStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: '#fff', display: 'flex', alignItems: 'stretch', justifyContent: 'stretch' }
    : { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }

  const modalBoxStyle: React.CSSProperties = isMobile
    ? { backgroundColor: '#fff', width: '100%', height: '100%', maxHeight: '100dvh', overflow: 'auto', display: 'flex', flexDirection: 'column' }
    : { backgroundColor: '#fff', border: '1px solid #d0d7de', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column' }

  const headerRadius = isMobile ? 0 : '6px 6px 0 0'
  const footerRadius = isMobile ? 0 : '0 0 6px 6px'

  return (
    <div className="p-4">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{t('teachers.title')}</h1>
        <button onClick={openAdd} style={{
          backgroundColor: '#1e293b', color: '#fff', border: 'none',
          borderRadius: 4, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 500,
          whiteSpace: 'nowrap',
        }}>
          + {t('teachers.add_teacher')}
        </button>
      </div>

      {/* Horizontally scrollable table */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12, backgroundColor: '#fff', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={th}>{t('teachers.name')}</th>
              <th style={th}>{t('teachers.group')}</th>
              <th style={th}>{t('teachers.contact')}</th>
              <th style={{ ...th, width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(teacher => (
              <tr key={teacher.id}>
                <td style={{ ...td, fontWeight: 500, color: '#111827' }}>{teacher.name}</td>
                <td style={td}>
                  {teacher.groupIds.length > 0
                    ? <span style={{ color: '#374151' }}>{teacher.groupIds.map(id => groupMap.get(id) ?? id).join(', ')}</span>
                    : <span style={{ color: '#9ca3af' }}>{t('teachers.no_group')}</span>}
                </td>
                <td style={{ ...td, fontFamily: 'monospace', color: '#374151' }}>{teacher.contact}</td>
                <td style={{ ...td, textAlign: 'center', padding: '4px 8px' }}>
                  <button onClick={() => openEdit(teacher)} title={t('common.edit')} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#1d4ed8')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>
                  </button>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: 20 }}>
                  {t('common.no_data')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div
          onClick={e => { if (!isMobile && e.target === e.currentTarget) closeModal() }}
          style={backdropStyle}
        >
          <div style={modalBoxStyle}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid #d0d7de',
              backgroundColor: '#f6f8fa', borderRadius: headerRadius, flexShrink: 0,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>
                {modal.mode === 'add' ? t('teachers.add_teacher') : t('teachers.edit_teacher')}
              </div>
              <button onClick={closeModal} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 18, color: '#6b7280', lineHeight: 1, padding: '2px 6px',
              }}>×</button>
            </div>

            {/* Body */}
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflow: 'auto' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  {t('teachers.name')}
                </label>
                <input
                  type="text"
                  value={modal.teacher.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder={t('teachers.name_placeholder')}
                  style={inputStyle(!!errors.name)}
                />
                {errors.name && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors.name}</div>}
              </div>

              {/* Groups (multi-select checkboxes) */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  {t('teachers.group')}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '6px 8px', border: '1px solid #d0d7de', borderRadius: 4, maxHeight: 160, overflowY: 'auto' }}>
                  {groups.map(g => {
                    const checked = modal.teacher.groupIds.includes(g.id)
                    return (
                      <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, padding: '2px 0' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? modal.teacher.groupIds.filter(id => id !== g.id)
                              : [...modal.teacher.groupIds, g.id]
                            setField('groupIds', next)
                          }}
                          style={{ accentColor: '#2563eb', cursor: 'pointer', width: 16, height: 16 }}
                        />
                        {g.name}
                      </label>
                    )
                  })}
                </div>
                {modal.teacher.groupIds.length === 0 && (
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{t('teachers.no_group')}</div>
                )}
              </div>

              {/* Contact */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  {t('teachers.contact')}
                </label>
                <input
                  type="tel"
                  value={modal.teacher.contact}
                  onChange={e => setField('contact', e.target.value)}
                  placeholder="+995 555 000 000"
                  style={inputStyle()}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 16px', borderTop: '1px solid #d0d7de',
              backgroundColor: '#f6f8fa', borderRadius: footerRadius, flexShrink: 0,
            }}>
              <div>
                {modal.mode === 'edit' && (
                  <button onClick={() => handleDelete(modal.teacher.id)} style={{
                    padding: '5px 12px', fontSize: 12, borderRadius: 4,
                    border: '1px solid #fca5a5', backgroundColor: '#fff',
                    color: '#dc2626', cursor: 'pointer',
                  }}>
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
