'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StudioRow {
  id: string
  name: string
  slug: string
  enabled: boolean
  users: { id: string; email: string; role: string }[]
}

interface Props {
  studios: StudioRow[]
}

export default function SuperAdminClient({ studios: initialStudios }: Props) {
  const router = useRouter()
  const [studios, setStudios] = useState(initialStudios)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
        const err = await res.json()
        setError(err.error ?? 'Failed')
        return
      }
      const studio = await res.json()
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

  void router

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 13,
    border: '1px solid #334155', borderRadius: 4, outline: 'none',
    backgroundColor: '#1e293b', color: '#f1f5f9', boxSizing: 'border-box',
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
              <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} placeholder="e.g. Harmony Music Studio" />
              {name && <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>slug: {slugify(name)}</div>}
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Admin Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="admin@studio.com" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} placeholder="Min 8 characters" />
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
            <div key={studio.id} style={{ border: '1px solid #334155', borderRadius: 6, padding: '12px 16px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{studio.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>/{studio.slug} · {studio.users.length} user{studio.users.length !== 1 ? 's' : ''}</div>
                <div style={{ marginTop: 4 }}>
                  {studio.users.map(u => (
                    <span key={u.id} style={{ fontSize: 10, color: '#94a3b8', backgroundColor: '#0f172a', padding: '1px 6px', borderRadius: 10, marginRight: 4 }}>{u.email}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, backgroundColor: studio.enabled ? '#14532d' : '#450a0a', color: studio.enabled ? '#86efac' : '#fca5a5' }}>
                  {studio.enabled ? 'Active' : 'Disabled'}
                </span>
                <button
                  onClick={() => toggleEnabled(studio.id, studio.enabled)}
                  style={{ padding: '4px 10px', fontSize: 11, borderRadius: 4, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                >
                  {studio.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
