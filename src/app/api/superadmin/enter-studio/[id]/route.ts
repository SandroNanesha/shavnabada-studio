import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as { role: string }).role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const studio = await prisma.studio.findUnique({ where: { id } })
  if (!studio) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const res = NextResponse.redirect(new URL('/pupils', _req.url))
  res.cookies.set('sa_studio_id', id, { path: '/', sameSite: 'lax', httpOnly: false })
  return res
}
