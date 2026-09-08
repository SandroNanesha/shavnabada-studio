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
  if (pathname.startsWith('/apply') || pathname.startsWith('/api/apply') || pathname === '/login') {
    return NextResponse.next()
  }

  // Admin routes — require studio session
  if (!session?.user?.studioId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
