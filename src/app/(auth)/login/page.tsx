'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/context'

export default function LoginPage() {
  const router = useRouter()
  const { t, lang, setLang } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    if (result?.error) {
      setLoading(false)
      setError(t('login.invalid'))
    } else {
      router.push('/pupils')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
      <div style={{ width: 360, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #d0d7de', padding: 32, position: 'relative' }}>

        {/* Lang toggle */}
        <div style={{ position: 'absolute', top: 14, right: 16, display: 'flex', gap: 4 }}>
          {(['en', 'ka'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid',
                borderColor: lang === l ? '#1d4ed8' : '#d0d7de',
                backgroundColor: lang === l ? '#eff6ff' : '#fff',
                color: lang === l ? '#1d4ed8' : '#6b7280',
              }}
            >
              {l === 'en' ? 'EN' : 'ქარ'}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Studio Admin</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{t('login.subtitle')}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d0d7de', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>{t('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d0d7de', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {error && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '9px', fontSize: 13, fontWeight: 600, backgroundColor: loading ? '#3b82f6' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.75s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            )}
            {loading ? t('login.signing_in') : t('login.sign_in')}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </form>
      </div>
    </div>
  )
}
