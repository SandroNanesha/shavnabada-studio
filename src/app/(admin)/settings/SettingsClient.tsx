'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/state/context'
import { useLanguage } from '@/lib/i18n/context'

interface Props {
  initialSettings: { studioName: string; futureMonths: number; paymentDueDay: number; platformLogo: string; formLogo: string }
}

const sectionStyle: React.CSSProperties = {
  border: '1px solid #d0d7de', borderRadius: 8, backgroundColor: '#fff', padding: 20, marginBottom: 20,
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px', fontSize: 13, border: '1px solid #d0d7de', borderRadius: 4,
  outline: 'none', boxSizing: 'border-box',
}

const btnStyle: React.CSSProperties = {
  padding: '6px 18px', fontSize: 12, borderRadius: 4, border: 'none',
  backgroundColor: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 600,
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

function LogoUpload({ label, noLogoLabel, removeLabel, value, onChange }: {
  label: string; noLogoLabel: string; removeLabel: string; value: string; onChange: (v: string) => void
}) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {value ? (
          <img src={value} alt="logo preview" style={{ height: 48, maxWidth: 160, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: 4, padding: 4, backgroundColor: '#f9fafb' }} />
        ) : (
          <div style={{ height: 48, width: 120, border: '1px dashed #d0d7de', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{noLogoLabel}</span>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize: 11, color: '#374151' }} />
          {value && (
            <button onClick={() => onChange('')} style={{ fontSize: 10, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              {removeLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SettingsClient({ initialSettings }: Props) {
  const { t, lang } = useLanguage()
  const { setFutureMonths, setPaymentDueDay, setStudioName, setPlatformLogo, setFormLogo } = useAppState()

  const [studioName, setLocalStudioName] = useState(initialSettings.studioName ?? 'Shavnabada Studio')
  const [futureMonths, setLocalFutureMonths] = useState(initialSettings.futureMonths ?? 2)
  const [paymentDueDay, setLocalPaymentDueDay] = useState(initialSettings.paymentDueDay ?? 1)
  const [platformLogo, setPlatformLogoState] = useState(initialSettings.platformLogo ?? '')
  const [formLogo, setFormLogoState] = useState(initialSettings.formLogo ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studioName, futureMonths, paymentDueDay, platformLogo, formLogo }),
      })
      if (res.ok) {
        setStudioName(studioName)
        setFutureMonths(futureMonths)
        setPaymentDueDay(paymentDueDay)
        setPlatformLogo(platformLogo)
        setFormLogo(formLogo)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  const dueDayDisplay = lang === 'ka'
    ? `${paymentDueDay} ${t('settings.due_day_hint_suffix')}`
    : `${ordinal(paymentDueDay)} ${t('settings.due_day_hint_suffix')}`

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20 }}>{t('settings.title')}</h1>

      {/* Studio */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 }}>{t('settings.studio_section')}</div>
        <label style={labelStyle}>{t('settings.studio_name')}</label>
        <input
          type="text"
          value={studioName}
          onChange={e => setLocalStudioName(e.target.value)}
          style={{ ...inputStyle, width: '100%' }}
          placeholder="e.g. Shavnabada Studio"
        />
      </div>

      {/* Payments */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 }}>{t('settings.payments_section')}</div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>{t('settings.due_day_label')}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="number"
              min={1}
              max={31}
              value={paymentDueDay}
              onChange={e => setLocalPaymentDueDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
              style={{ ...inputStyle, width: 80 }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {t('settings.due_day_hint_prefix')} <strong>{dueDayDisplay}</strong>
            </span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>{t('settings.future_months_label')}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="number"
              min={0}
              max={24}
              value={futureMonths}
              onChange={e => setLocalFutureMonths(Math.max(0, Math.min(24, parseInt(e.target.value) || 0)))}
              style={{ ...inputStyle, width: 80 }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {futureMonths === 0
                ? t('settings.future_months_current')
                : `${futureMonths} ${t('settings.future_months_hint')}`}
            </span>
          </div>
        </div>
      </div>

      {/* Logos */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 }}>{t('settings.logos_section')}</div>
        <LogoUpload
          label={t('settings.platform_logo_label')}
          noLogoLabel={t('settings.no_logo')}
          removeLabel={t('settings.remove_logo')}
          value={platformLogo}
          onChange={setPlatformLogoState}
        />
        <LogoUpload
          label={t('settings.form_logo_label')}
          noLogoLabel={t('settings.no_logo')}
          removeLabel={t('settings.remove_logo')}
          value={formLogo}
          onChange={setFormLogoState}
        />
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={save} disabled={saving} style={{ ...btnStyle, opacity: saving ? 0.6 : 1 }}>
          {saving ? t('settings.saving_btn') : t('settings.save_btn')}
        </button>
        {saved && <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>{t('settings.saved')}</span>}
      </div>
    </div>
  )
}
