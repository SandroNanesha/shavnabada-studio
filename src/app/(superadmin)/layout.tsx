import { requireSuperAdmin } from '@/lib/session'
import type { ReactNode } from 'react'

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  await requireSuperAdmin()
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <div style={{ backgroundColor: '#1e293b', padding: '12px 24px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700 }}>Super Admin</span>
        <a href="/superadmin/logout" style={{ color: '#94a3b8', fontSize: 12 }}>Sign out</a>
      </div>
      <div style={{ padding: 24 }}>
        {children}
      </div>
    </div>
  )
}
