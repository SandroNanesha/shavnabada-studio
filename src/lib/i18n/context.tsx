'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { translations } from './translations'
import type { Lang } from './translations'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
})

function getNestedValue(obj: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = obj
  for (const segment of path) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const stored = localStorage.getItem('studio-lang')
    if (stored === 'en' || stored === 'ka') {
      setLangState(stored)
    }
  }, [])

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('studio-lang', newLang)
  }, [])

  const t = useCallback(
    (key: string): string => {
      const path = key.split('.')
      const langTranslations = translations[lang] as Record<string, unknown>
      const enTranslations = translations['en'] as Record<string, unknown>

      const value = getNestedValue(langTranslations, path)
      if (typeof value === 'string') return value

      // Fallback to English
      const enValue = getNestedValue(enTranslations, path)
      if (typeof enValue === 'string') return enValue

      // Last resort: return key
      return key
    },
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext)
}
