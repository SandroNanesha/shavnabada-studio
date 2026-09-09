import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Superadmin routes
  if (pathname.startsWith('/superadmin')) {
    if (pathname === '/superadmin/login') return NextResponse.next()
    if (!session || (session.user as { role: string }).role !== 'super_admin') {
      return NextResponse.redirect(new URL('/superadmin/login', req.url))
    }
    return NextResponse.next()
  }

  // Public routes
  if (pathname.startsWith('/apply') || pathname.startsWith('/api/apply') || pathname === '/login' || pathname.startsWith('/api/auth') || pathname === '/api/studio-icon') {
    return NextResponse.next()
  }

  // Super admin API routes — allow super_admin through
  if (pathname.startsWith('/api/superadmin')) {
    if (!session || (session.user as { role: string }).role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Admin routes — require studio session
  if (!session?.user?.studioId) {
    // Super admin can access admin routes if they have a studio cookie
    const role = (session?.user as { role?: string })?.role
    if (role === 'super_admin' && req.cookies.get('sa_studio_id')?.value) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
