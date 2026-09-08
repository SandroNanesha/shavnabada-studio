'use client'

import { useAppState } from '@/lib/state/context'
import { useLanguage } from '@/lib/i18n/context'

export default function SidebarBrand() {
  const { platformLogo, studioName } = useAppState()
  const { t } = useLanguage()

  return (
    <div>
      {platformLogo ? (
        <img src={platformLogo} alt="logo" style={{ height: 36, maxWidth: 120, objectFit: 'contain', marginBottom: 2 }} />
      ) : (
        <span className="text-white font-semibold text-sm tracking-wide">{t('brand')}</span>
      )}
      <div className="text-slate-400 text-xs mt-0.5">{studioName}</div>
    </div>
  )
}
