'use client'

import { useState } from 'react'

interface StudioUser {
  id: string
  email: string
  role: string
}

interface StudioRow {
  id: string
  name: string
  slug: string
  enabled: boolean
  users: StudioUser[]
}

interface SuperAdmin {
  id: string
  email: string
  role: string
}

interface Props {
  studios: StudioRow[]
  superAdmins: SuperAdmin[]
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: 13,
  border: '1px solid #334155', borderRadius: 4, outline: 'none',
  backgroundColor: '#0f172a', color: '#f1f5f9', boxSizing: 'border-box',
}

function PasswordInput({ value, onChange, placeholder, autoFocus }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        autoFocus={autoFocus}
        placeholder={placeholder}
        style={{ ...inputStyle, paddingRight: 34 }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#64748b', lineHeight: 1 }}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  )
}

function ChangePasswordForm({ studioId, userId, onDone, endpoint }: { studioId: string; userId: string; onDone: () => void; endpoint?: string }) {
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    setSaving(true)
    setError('')
    try {
      const url = endpoint ?? `/api/superadmin/studios/${studioId}/users/${userId}`
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const text = await res.text()
        let message = 'Failed'
        try { message = (JSON.parse(text) as { error?: string }).error ?? 'Failed' } catch { /* empty */ }
        setError(message)
        return
      }
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
      <div style={{ width: 200 }}>
      <PasswordInput
        value={password}
        onChange={setPassword}
        placeholder="New password"
        autoFocus
      />
      </div>
      <button type="submit" disabled={saving} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4, border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button type="button" onClick={onDone} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 4, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
        Cancel
      </button>
      {error && <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>}
    </form>
  )
}

function AddUserForm({ studioId, onAdded, onCancel }: { studioId: string; onAdded: (user: StudioUser) => void; onCancel: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/superadmin/studios/${studioId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      if (!res.ok) {
        const text = await res.text()
        let message = 'Failed'
        try { message = (JSON.parse(text) as { error?: string }).error ?? 'Failed' } catch { /* empty */ }
        setError(message)
        return
      }
      const user = await res.json() as StudioUser
      onAdded(user)
      onCancel()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ border: '1px solid #334155', borderRadius: 4, padding: 12, marginTop: 10, backgroundColor: '#1e293b' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>New Admin</div>
      <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={inputStyle} placeholder="admin@studio.com" />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Password</label>
          <PasswordInput value={password} onChange={setPassword} placeholder="Min 8 characters" />
        </div>
      </div>
      {error && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={saving} style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 4, border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Adding…' : 'Add Admin'}
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '5px 12px', fontSize: 12, borderRadius: 4, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function SuperAdminClient({ studios: initialStudios, superAdmins: initialSuperAdmins }: Props) {
  const [studios, setStudios] = useState(initialStudios)
  const [superAdmins, setSuperAdmins] = useState(initialSuperAdmins)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [addingUserTo, setAddingUserTo] = useState<string | null>(null)
  const [changingPasswordFor, setChangingPasswordFor] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showSAForm, setShowSAForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saEmail, setSaEmail] = useState('')
  const [saPassword, setSaPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingSA, setSavingSA] = useState(false)
  const [error, setError] = useState('')
  const [saError, setSaError] = useState('')
  const [changingPasswordForSA, setChangingPasswordForSA] = useState<string | null>(null)

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const createStudio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/superadmin/studios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slugify(name), email: email.trim(), password }),
      })
      if (!res.ok) {
        const text = await res.text()
        let message = 'Failed'
        try { message = (JSON.parse(text) as { error?: string }).error ?? 'Failed' } catch { /* empty */ }
        setError(message)
        return
      }
      const studio = await res.json() as StudioRow
      setStudios(prev => [studio, ...prev])
      setShowForm(false)
      setName(''); setEmail(''); setPassword('')
    } finally {
      setSaving(false)
    }
  }

  const toggleEnabled = async (id: string, enabled: boolean) => {
    await fetch(`/api/superadmin/studios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !enabled }),
    })
    setStudios(prev => prev.map(s => s.id === id ? { ...s, enabled: !enabled } : s))
  }

  const removeUser = async (studioId: string, userId: string) => {
    const res = await fetch(`/api/superadmin/studios/${studioId}/users/${userId}`, { method: 'DELETE' })
    if (res.ok) {
      setStudios(prev => prev.map(s => s.id === studioId ? { ...s, users: s.users.filter(u => u.id !== userId) } : s))
    }
  }

  const addUser = (studioId: string, user: StudioUser) => {
    setStudios(prev => prev.map(s => s.id === studioId ? { ...s, users: [...s.users, user] } : s))
  }

  const createSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!saEmail.trim() || !saPassword.trim()) return
    setSavingSA(true)
    setSaError('')
    try {
      const res = await fetch('/api/superadmin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: saEmail.trim(), password: saPassword }),
      })
      if (!res.ok) {
        const text = await res.text()
        let message = 'Failed'
        try { message = (JSON.parse(text) as { error?: string }).error ?? 'Failed' } catch { /* empty */ }
        setSaError(message)
        return
      }
      const admin = await res.json() as SuperAdmin
      setSuperAdmins(prev => [...prev, admin])
      setShowSAForm(false)
      setSaEmail(''); setSaPassword('')
    } finally {
      setSavingSA(false)
    }
  }

  const removeSuperAdmin = async (id: string) => {
    const res = await fetch(`/api/superadmin/admins/${id}`, { method: 'DELETE' })
    if (res.ok) setSuperAdmins(prev => prev.filter(a => a.id !== id))
    else {
      const text = await res.text()
      try { alert((JSON.parse(text) as { error?: string }).error ?? 'Failed') } catch { alert('Failed') }
    }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Studios</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 4, border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer' }}
        >
          + Add Studio
        </button>
      </div>

      {showForm && (
        <form onSubmit={createStudio} style={{ border: '1px solid #334155', borderRadius: 6, padding: 20, marginBottom: 20, backgroundColor: '#1e293b' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>New Studio</div>
          <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Studio Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required style={{ ...inputStyle, backgroundColor: '#0f172a' }} placeholder="e.g. Harmony Music Studio" />
              {name && <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>slug: {slugify(name)}</div>}
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Admin Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ ...inputStyle, backgroundColor: '#0f172a' }} placeholder="admin@studio.com" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Password</label>
              <PasswordInput value={password} onChange={setPassword} placeholder="Min 8 characters" />
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 4, border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Creating…' : 'Create Studio'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '6px 16px', fontSize: 12, borderRadius: 4, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {studios.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: 13 }}>No studios yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {studios.map(studio => (
            <div key={studio.id} style={{ border: '1px solid #334155', borderRadius: 6, backgroundColor: '#1e293b', overflow: 'hidden' }}>
              {/* Studio header row */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setExpanded(expanded === studio.id ? null : studio.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', flex: 1 }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{studio.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>/{studio.slug} · {studio.users.length} admin{studio.users.length !== 1 ? 's' : ''}</div>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, backgroundColor: studio.enabled ? '#14532d' : '#450a0a', color: studio.enabled ? '#86efac' : '#fca5a5' }}>
                    {studio.enabled ? 'Active' : 'Disabled'}
                  </span>
                  <a
                    href={`/api/superadmin/enter-studio/${studio.id}`}
                    style={{ padding: '4px 10px', fontSize: 11, borderRadius: 4, border: '1px solid #2563eb', backgroundColor: 'transparent', color: '#60a5fa', cursor: 'pointer', textDecoration: 'none' }}
                  >
                    Enter Studio
                  </a>
                  <button
                    onClick={() => toggleEnabled(studio.id, studio.enabled)}
                    style={{ padding: '4px 10px', fontSize: 11, borderRadius: 4, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {studio.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === studio.id ? null : studio.id)}
                    style={{ padding: '4px 10px', fontSize: 11, borderRadius: 4, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {expanded === studio.id ? 'Close' : 'Admins'}
                  </button>
                </div>
              </div>

              {/* Expanded admins panel */}
              {expanded === studio.id && (
                <div style={{ borderTop: '1px solid #334155', padding: '14px 16px', backgroundColor: '#0f172a' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admins</div>
                  {studio.users.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#475569', margin: '0 0 10px' }}>No admins yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                      {studio.users.map(u => (
                        <div key={u.id} style={{ padding: '6px 10px', backgroundColor: '#1e293b', borderRadius: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <span style={{ fontSize: 13, color: '#f1f5f9' }}>{u.email}</span>
                              <span style={{ fontSize: 10, color: '#475569', marginLeft: 8 }}>{u.role}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => setChangingPasswordFor(changingPasswordFor === u.id ? null : u.id)}
                                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                              >
                                {changingPasswordFor === u.id ? 'Cancel' : 'Change Password'}
                              </button>
                              <button
                                onClick={() => removeUser(studio.id, u.id)}
                                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid #7f1d1d', backgroundColor: 'transparent', color: '#f87171', cursor: 'pointer' }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {changingPasswordFor === u.id && (
                            <ChangePasswordForm
                              studioId={studio.id}
                              userId={u.id}
                              onDone={() => setChangingPasswordFor(null)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {addingUserTo === studio.id ? (
                    <AddUserForm
                      studioId={studio.id}
                      onAdded={user => addUser(studio.id, user)}
                      onCancel={() => setAddingUserTo(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setAddingUserTo(studio.id)}
                      style={{ marginTop: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 4, border: '1px dashed #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      + Add Admin
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Superadmins section */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Superadmins</h2>
          <button
            onClick={() => setShowSAForm(v => !v)}
            style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 4, border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer' }}
          >
            + Add Superadmin
          </button>
        </div>

        {showSAForm && (
          <form onSubmit={createSuperAdmin} style={{ border: '1px solid #334155', borderRadius: 6, padding: 20, marginBottom: 20, backgroundColor: '#1e293b' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>New Superadmin</div>
            <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Email</label>
                <input type="email" value={saEmail} onChange={e => setSaEmail(e.target.value)} required style={{ ...inputStyle, backgroundColor: '#0f172a' }} placeholder="admin@example.com" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Password</label>
                <PasswordInput value={saPassword} onChange={setSaPassword} placeholder="Min 8 characters" />
              </div>
            </div>
            {saError && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>{saError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={savingSA} style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 4, border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: savingSA ? 'not-allowed' : 'pointer', opacity: savingSA ? 0.6 : 1 }}>
                {savingSA ? 'Creating…' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowSAForm(false)} style={{ padding: '6px 16px', fontSize: 12, borderRadius: 4, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {superAdmins.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13 }}>No superadmins yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {superAdmins.map(a => (
              <div key={a.id} style={{ border: '1px solid #334155', borderRadius: 6, padding: '10px 16px', backgroundColor: '#1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#f1f5f9' }}>{a.email}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setChangingPasswordForSA(changingPasswordForSA === a.id ? null : a.id)}
                      style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      {changingPasswordForSA === a.id ? 'Cancel' : 'Change Password'}
                    </button>
                    <button
                      onClick={() => removeSuperAdmin(a.id)}
                      style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid #7f1d1d', backgroundColor: 'transparent', color: '#f87171', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {changingPasswordForSA === a.id && (
                  <ChangePasswordForm
                    studioId=""
                    userId={a.id}
                    onDone={() => setChangingPasswordForSA(null)}
                    endpoint={`/api/superadmin/admins/${a.id}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
