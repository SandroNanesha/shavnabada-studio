'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Fuse from 'fuse.js'
import type {
  Application,
  ApplicationStatus,
  ApplicationForm,
  ApplicationFormField,
  FormFieldType,
  Group,
  PaymentClassification,
} from '@/types'
import { useLanguage } from '@/lib/i18n/context'
import AddPupilModal from '@/components/admin/pupils/AddPupilModal'

interface ApplicationsViewProps {
  applications: Application[]
  forms: ApplicationForm[]
  groups: Group[]
  classifications: PaymentClassification[]
}

const STATUS_BADGE: Record<ApplicationStatus, { bg: string; text: string }> = {
  pending: { bg: '#fef9c3', text: '#854d0e' },
  approved: { bg: '#dcfce7', text: '#166534' },
  dismissed: { bg: '#fee2e2', text: '#991b1b' },
}
// Only show these tabs (approved removed from UI)


type TabType = ApplicationStatus | 'forms'

// ---- Form Builder types ----
interface FieldDraft {
  id: string
  label: string
  type: FormFieldType
  required: boolean
}

interface FormDraft {
  title: string
  fields: FieldDraft[]
  disabledPredefined: string[]
}

function newFieldDraft(): FieldDraft {
  return { id: Math.random().toString(36).slice(2), label: '', type: 'text', required: false }
}

// ---- Trash icon ----
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
    </svg>
  )
}

// ---- Pencil icon ----
function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
    </svg>
  )
}

// ---- Copy icon ----
function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
      <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
    </svg>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '5px 8px',
  fontSize: 12,
  border: '1px solid #d0d7de',
  borderRadius: 4,
  outline: 'none',
  boxSizing: 'border-box',
  width: '100%',
}

export default function ApplicationsView({
  applications,
  forms: initialForms,
  groups,
  classifications,
}: ApplicationsViewProps) {
  const { t, lang } = useLanguage()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('forms')
  const [search, setSearch] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(id)
  }, [router])

  // ---- applications state ----
  const [appList, setAppList] = useState<Application[]>(applications)

  const dismissApp = async (id: string) => {
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'dismissed' }),
    })
    if (res.ok) {
      setAppList(prev => prev.map(a => a.id === id ? { ...a, status: 'dismissed' as const } : a))
    }
  }

  // ---- forms state ----
  const [forms, setForms] = useState<ApplicationForm[]>(initialForms)
  const [showFormEditor, setShowFormEditor] = useState(false)
  const [editingFormId, setEditingFormId] = useState<string | null>(null)
  const [formDraft, setFormDraft] = useState<FormDraft>({ title: '', fields: [], disabledPredefined: [] })
  const [newFieldDraftState, setNewFieldDraftState] = useState<FieldDraft>(newFieldDraft())
  const [savingForm, setSavingForm] = useState(false)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  // ---- add-as-pupil state ----
  const [addPupilApp, setAddPupilApp] = useState<Application | null>(null)

  // ---- tabs ----
  const statusTabs: ApplicationStatus[] = ['pending', 'dismissed']
  const allTabs: TabType[] = ['forms', ...statusTabs]

  const tabLabel = (tab: TabType) => {
    if (tab === 'forms') return t('applications.forms_tab')
    const count = appList.filter(a => a.status === tab).length
    return `${t(`applications.${tab}`)} (${count})`
  }

  // ---- form editor helpers ----
  const openNewForm = () => {
    setEditingFormId(null)
    setFormDraft({ title: '', fields: [], disabledPredefined: [] })
    setNewFieldDraftState(newFieldDraft())
    setShowFormEditor(true)
  }

  const openEditForm = (form: ApplicationForm) => {
    setEditingFormId(form.id)
    setFormDraft({ title: form.title, fields: form.fields.map(f => ({ ...f })), disabledPredefined: form.disabledPredefined ?? [] })
    setNewFieldDraftState(newFieldDraft())
    setShowFormEditor(true)
  }

  const togglePredefined = (key: string) => {
    setFormDraft(prev => ({
      ...prev,
      disabledPredefined: prev.disabledPredefined.includes(key)
        ? prev.disabledPredefined.filter(k => k !== key)
        : [...prev.disabledPredefined, key],
    }))
  }

  const cancelFormEditor = () => {
    setShowFormEditor(false)
    setEditingFormId(null)
  }

  const addFieldToDraft = () => {
    if (!newFieldDraftState.label.trim()) return
    setFormDraft(prev => ({ ...prev, fields: [...prev.fields, { ...newFieldDraftState }] }))
    setNewFieldDraftState(newFieldDraft())
  }

  const removeFieldFromDraft = (id: string) => {
    setFormDraft(prev => ({ ...prev, fields: prev.fields.filter(f => f.id !== id) }))
  }

  const saveForm = async () => {
    if (!formDraft.title.trim()) return
    setSavingForm(true)
    try {
      if (editingFormId) {
        const res = await fetch(`/api/forms/${editingFormId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: formDraft.title, fields: formDraft.fields, disabledPredefined: formDraft.disabledPredefined }),
        })
        if (res.ok) {
          const updated = await res.json() as ApplicationForm
          setForms(prev => prev.map(f => f.id === editingFormId ? updated : f))
        }
      } else {
        const res = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: formDraft.title, fields: formDraft.fields, disabledPredefined: formDraft.disabledPredefined }),
        })
        if (res.ok) {
          const created = await res.json() as ApplicationForm
          setForms(prev => [created, ...prev])
        }
      }
      setShowFormEditor(false)
      setEditingFormId(null)
    } finally {
      setSavingForm(false)
    }
  }

  const deleteForm = async (id: string) => {
    if (!confirm(t('applications.delete_form_confirm'))) return
    const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setForms(prev => prev.filter(f => f.id !== id))
    }
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/apply/${slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug(null), 2000)
    })
  }

  // ---- forms tab UI ----
  const renderFormsTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t('applications.forms_tab')}</span>
        {!showFormEditor && (
          <button
            onClick={openNewForm}
            style={{ padding: '5px 14px', fontSize: 12, borderRadius: 4, border: 'none', backgroundColor: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            + {t('applications.add_form')}
          </button>
        )}
      </div>

      {showFormEditor && (
        <div style={{ border: '1px solid #d0d7de', borderRadius: 6, backgroundColor: '#f6f8fa', padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
            {editingFormId ? t('common.edit') : t('applications.add_form')}
          </div>

          {/* Title */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              {t('applications.form_title')} *
            </label>
            <input
              type="text"
              value={formDraft.title}
              onChange={e => setFormDraft(prev => ({ ...prev, title: e.target.value }))}
              style={inputStyle}
              placeholder="e.g. Music Studio Enrollment"
              autoFocus
            />
          </div>

          {/* Fixed (predefined) fields — always present, not removable */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              {t('applications.predefined_fields')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { key: 'firstName', label: t('applications.predefined_first_name'), type: 'text' },
                { key: 'lastName', label: t('applications.predefined_last_name'), type: 'text' },
                { key: 'birthDate', label: t('applications.predefined_birth_date'), type: 'date' },
                { key: 'idNumber', label: t('applications.predefined_id_number'), type: 'text' },
                { key: 'parents', label: t('applications.predefined_parent'), type: 'text' },
              ].map(f => {
                const disabled = formDraft.disabledPredefined.includes(f.key)
                return (
                  <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: disabled ? '#fef2f2' : '#f8fafc', border: `1px solid ${disabled ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 4, padding: '5px 10px', opacity: disabled ? 0.6 : 1 }}>
                    <span style={{ fontSize: 12, flex: 1, color: disabled ? '#9ca3af' : '#374151', textDecoration: disabled ? 'line-through' : 'none' }}>{f.label}</span>
                    <span style={{ fontSize: 10, color: '#6b7280', backgroundColor: '#e2e8f0', padding: '1px 6px', borderRadius: 10 }}>{f.type}</span>
                    {!disabled && <span style={{ fontSize: 10, color: '#dc2626' }}>*</span>}
                    <button
                      onClick={() => togglePredefined(f.key)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: disabled ? '#16a34a' : '#9ca3af', display: 'flex', alignItems: 'center', padding: 2, fontSize: 10, fontWeight: 600 }}
                      onMouseEnter={e => (e.currentTarget.style.color = disabled ? '#15803d' : '#dc2626')}
                      onMouseLeave={e => (e.currentTarget.style.color = disabled ? '#16a34a' : '#9ca3af')}
                      title={disabled ? 'Restore' : 'Remove'}
                    >
                      {disabled ? '↩' : <TrashIcon />}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Custom fields (removable) */}
          {formDraft.fields.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              {t('applications.extra_fields')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {formDraft.fields.map(field => (
                  <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 10px' }}>
                    <span style={{ fontSize: 12, flex: 1, color: '#111827' }}>{field.label}</span>
                    <span style={{ fontSize: 10, color: '#6b7280', backgroundColor: '#f3f4f6', padding: '1px 6px', borderRadius: 10 }}>{field.type}</span>
                    {field.required && <span style={{ fontSize: 10, color: '#dc2626' }}>*</span>}
                    <button
                      onClick={() => removeFieldFromDraft(field.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 2 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add field row */}
          <div style={{ border: '1px dashed #d0d7de', borderRadius: 4, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {t('applications.add_field')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                value={newFieldDraftState.label}
                onChange={e => setNewFieldDraftState(prev => ({ ...prev, label: e.target.value }))}
                style={inputStyle}
                placeholder={t('applications.field_label')}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFieldToDraft() } }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <select
                  value={newFieldDraftState.type}
                  onChange={e => setNewFieldDraftState(prev => ({ ...prev, type: e.target.value as FormFieldType }))}
                  style={{ ...inputStyle, width: isMobile ? '100%' : 'auto', cursor: 'pointer' }}
                >
                  <option value="text">text</option>
                  <option value="phone">phone</option>
                  <option value="date">date</option>
                  <option value="textarea">textarea</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#374151', whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={newFieldDraftState.required}
                    onChange={e => setNewFieldDraftState(prev => ({ ...prev, required: e.target.checked }))}
                    style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                  {t('applications.field_req')}
                </label>
                <button
                  onClick={addFieldToDraft}
                  style={{ padding: '5px 10px', fontSize: 11, borderRadius: 4, border: '1px solid #93c5fd', backgroundColor: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: isMobile ? 0 : 'auto' }}
                >
                  + {t('applications.add_field')}
                </button>
              </div>
            </div>
          </div>

          {/* Save/Cancel */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={cancelFormEditor}
              style={{ padding: '5px 14px', fontSize: 12, borderRadius: 4, border: '1px solid #d0d7de', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={saveForm}
              disabled={savingForm || !formDraft.title.trim()}
              style={{ padding: '5px 14px', fontSize: 12, borderRadius: 4, border: 'none', backgroundColor: savingForm ? '#93c5fd' : '#1d4ed8', color: '#fff', cursor: savingForm ? 'not-allowed' : 'pointer', fontWeight: 600 }}
            >
              {savingForm ? '…' : t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Form list */}
      {forms.length === 0 && !showFormEditor ? (
        <p style={{ fontSize: 12, color: '#9ca3af' }}>{t('applications.no_forms')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {forms.map(form => (
            <div key={form.id} style={{ border: '1px solid #d0d7de', borderRadius: 6, backgroundColor: '#fff', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '10px 14px' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 4 : 10, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{form.title}</span>
                  <span style={{ fontSize: 10, color: '#6b7280', fontFamily: 'monospace', wordBreak: 'break-all' }}>/apply/{form.slug.length > 30 ? form.slug.slice(0, 30) + '…' : form.slug}</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 7px',
                    borderRadius: 10,
                    backgroundColor: form.active ? '#dcfce7' : '#f3f4f6',
                    color: form.active ? '#166534' : '#6b7280',
                  }}>
                    {form.active ? t('applications.form_active') : t('applications.form_inactive')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <a
                    href={`/apply/${form.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, borderRadius: 4, border: '1px solid #d0d7de', backgroundColor: '#f6f8fa', color: '#374151', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/><path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/></svg>
                    {t('applications.open_link')}
                  </a>
                  <button
                    onClick={() => copyLink(form.slug)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, borderRadius: 4, border: '1px solid #d0d7de', backgroundColor: '#f6f8fa', color: '#374151', cursor: 'pointer', fontWeight: 500 }}
                  >
                    <CopyIcon />
                    {copiedSlug === form.slug ? t('applications.link_copied') : t('applications.copy_link')}
                  </button>
                  <button
                    onClick={() => openEditForm(form)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #d0d7de', backgroundColor: '#f6f8fa', color: '#374151', cursor: 'pointer' }}
                    title={t('common.edit')}
                  >
                    <PencilIcon />
                  </button>
                  <button
                    onClick={() => deleteForm(form.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #fca5a5', backgroundColor: '#fee2e2', color: '#991b1b', cursor: 'pointer' }}
                    title={t('common.delete')}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
              {form.fields.length > 0 && (
                <div style={{ padding: '6px 14px 10px', borderTop: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {form.fields.map(f => (
                      <span key={f.id} style={{ fontSize: 10, color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: 10 }}>
                        {f.label} ({f.type}){f.required ? ' *' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ---- application cards ----
  const tabApps = activeTab !== 'forms' ? appList.filter(a => a.status === activeTab) : []

  const fuse = useMemo(() => new Fuse(tabApps, {
    keys: [
      { name: 'pupilFirstName', weight: 0.4 },
      { name: 'pupilSurname', weight: 0.4 },
      { name: 'idNumber', weight: 0.2 },
    ],
    threshold: 0.4,
    includeScore: true,
  }), [tabApps])

  const filtered = search.trim()
    ? fuse.search(search).map(r => r.item)
    : tabApps

  return (
    <div className="p-4">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
          {t('applications.title')}
        </h1>
        <button
          onClick={() => router.refresh()}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: 11, borderRadius: 4, border: '1px solid #d0d7de', backgroundColor: '#f6f8fa', color: '#374151', cursor: 'pointer' }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"/></svg>
          {t('applications.refresh')}
        </button>
      </div>

      {/* Search */}
      {activeTab !== 'forms' && (
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="#9ca3af" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`${t('pupils.search_placeholder')}…`}
            style={{ width: '100%', padding: '6px 10px 6px 28px', fontSize: 12, border: '1px solid #d0d7de', borderRadius: 4, outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #e5e7eb',
          marginBottom: 16,
          gap: 0,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
      >
        {allTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#1d4ed8' : '#6b7280',
              borderBottom: activeTab === tab ? '2px solid #1d4ed8' : '2px solid transparent',
              marginBottom: -2,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Forms tab */}
      {activeTab === 'forms' && renderFormsTab()}

      {/* Application cards */}
      {activeTab !== 'forms' && (
        filtered.length === 0 ? (
          <p style={{ fontSize: 12, color: '#9ca3af' }}>{t('applications.no_applications')}</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => {
              const submittedDate = new Date(app.submittedAt).toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-GB', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })

              return (
                <div
                  key={app.id}
                  style={{ border: '1px solid #d0d7de', borderRadius: 6, backgroundColor: '#fff', overflow: 'hidden' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                      padding: '10px 14px',
                      backgroundColor: '#f6f8fa',
                      borderBottom: '1px solid #d0d7de',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                        {app.pupilFirstName} {app.pupilSurname}
                      </span>
                      <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 10, display: 'inline-block' }}>
                        {t('applications.dob')}: {app.birthDate}
                      </span>
                      {app.idNumber && (
                        <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 10, display: 'inline-block', fontFamily: 'monospace' }}>
                          ID: {app.idNumber}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {app.status === 'pending' && (
                        <button
                          onClick={() => dismissApp(app.id)}
                          style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: 4, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {t('applications.dismiss')}
                        </button>
                      )}
                      <button
                        onClick={() => setAddPupilApp(app)}
                        style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 4, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {t('applications.add_as_pupil')}
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                          {t('pupil_detail.parents')}
                        </div>
                        {app.parents.map((parent, i) => (
                          <div key={i} style={{ fontSize: 12, color: '#374151' }}>
                            <span style={{ fontWeight: 500 }}>{parent.name}</span>
                            {' — '}
                            <span style={{ fontFamily: 'monospace' }}>{parent.phone}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                          {t('applications.document')}
                        </div>
                        <div style={{ fontSize: 12, color: app.documentFilename ? '#1d4ed8' : '#9ca3af' }}>
                          {app.documentFilename ?? t('applications.no_document')}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                          {t('applications.submitted')}
                        </div>
                        <div style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace' }}>
                          {submittedDate}
                        </div>
                      </div>
                    </div>

                    {app.customValues.length > 0 && (
                      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 4 }}>
                        {app.customValues.map((cv, i) => (
                          <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 3 }}>
                            <span style={{ fontWeight: 600, color: '#6b7280' }}>{cv.label}: </span>
                            {cv.value}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Add as pupil modal */}
      {addPupilApp && (
        <AddPupilModal
          groups={groups}
          classifications={classifications}
          prefillFirstName={addPupilApp.pupilFirstName}
          prefillSurname={addPupilApp.pupilSurname}
          prefillBirthDate={addPupilApp.birthDate}
          prefillIdNumber={addPupilApp.idNumber}
          prefillParents={addPupilApp.parents}
          source="application"
          onSave={async () => {
            if (addPupilApp) {
              const id = addPupilApp.id
              setAddPupilApp(null)
              await fetch(`/api/applications/${id}`, { method: 'DELETE' })
              setAppList(prev => prev.filter(a => a.id !== id))
            }
          }}
          onClose={() => setAddPupilApp(null)}
        />
      )}
    </div>
  )
}

