'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/context'
import { AppStateProvider } from '@/lib/state/context'
import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import SidebarBrand from '@/components/admin/SidebarBrand'
import { signOut } from 'next-auth/react'

const navLinks = [
  { href: '/pupils', key: 'nav.pupils' },
  { href: '/teachers', key: 'nav.teachers' },
  { href: '/groups', key: 'nav.groups_locations' },
  { href: '/classifications', key: 'nav.classifications' },
  { href: '/applications', key: 'nav.applications' },
  { href: '/settings', key: 'nav.settings' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { t, lang, setLang } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSuperAdminView, setIsSuperAdminView] = useState(false)

  useEffect(() => {
    setIsSuperAdminView(document.cookie.includes('sa_studio_id='))
  }, [])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar on route change (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-4 py-4 border-b border-slate-700" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SidebarBrand />
        {isMobile && (
          <button
            onClick={closeSidebar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20, lineHeight: 1, padding: '2px 4px' }}
            aria-label="Close menu"
          >
            ×
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        {navLinks.map(({ href, key }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center px-4 py-2 text-xs transition-colors"
              style={{
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? '#334155' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {t(key)}
            </Link>
          )
        })}
      </nav>

      {/* Language toggle */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex gap-1">
          <button
            onClick={() => setLang('en')}
            className="flex-1 py-1 text-xs rounded transition-colors"
            style={{
              backgroundColor: lang === 'en' ? '#475569' : 'transparent',
              color: lang === 'en' ? '#ffffff' : '#94a3b8',
              border: '1px solid #475569',
            }}
          >
            EN
          </button>
          <button
            onClick={() => setLang('ka')}
            className="flex-1 py-1 text-xs rounded transition-colors"
            style={{
              backgroundColor: lang === 'ka' ? '#475569' : 'transparent',
              color: lang === 'ka' ? '#ffffff' : '#94a3b8',
              border: '1px solid #475569',
            }}
          >
            KA
          </button>
        </div>
      </div>

      {/* Sign out / back */}
      <div className="px-4 pb-4" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {isSuperAdminView && (
          <a
            href="/api/superadmin/exit-studio"
            style={{ display: 'block', textAlign: 'center', padding: '6px', fontSize: 11, borderRadius: 4, border: '1px solid #2563eb', backgroundColor: 'transparent', color: '#60a5fa', cursor: 'pointer', textDecoration: 'none' }}
          >
            ← Superadmin
          </a>
        )}
        <button
          onClick={() => signOut({ redirectTo: '/login' })}
          style={{ width: '100%', padding: '6px', fontSize: 11, borderRadius: 4, border: '1px solid #475569', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <AppStateProvider>
      <div className="flex min-h-screen" style={{ zoom: 1.35 }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside
            style={{ width: 150, backgroundColor: '#1e293b', flexShrink: 0 }}
            className="flex flex-col"
          >
            {sidebarContent}
          </aside>
        )}

        {/* Mobile: overlay backdrop */}
        {isMobile && sidebarOpen && (
          <div
            onClick={closeSidebar}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          />
        )}

        {/* Mobile: slide-in drawer */}
        {isMobile && (
          <aside
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0,
              width: 240,
              backgroundColor: '#1e293b',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.25s ease',
            }}
          >
            {sidebarContent}
          </aside>
        )}

        {/* Main content */}
        <main
          className="flex-1 overflow-auto"
          style={{ backgroundColor: '#f8f9fa', minWidth: 0 }}
        >
          {/* Mobile top bar */}
          {isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px',
              backgroundColor: '#1e293b',
              position: 'sticky', top: 0, zIndex: 30,
            }}>
              <button
                onClick={() => setSidebarOpen(o => !o)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#e2e8f0', fontSize: 20, lineHeight: 1,
                  padding: '4px 6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Open menu"
              >
                ☰
              </button>
              <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}>
                {t('brand')}
              </span>
            </div>
          )}
          {children}
        </main>
      </div>
    </AppStateProvider>
  )
}
