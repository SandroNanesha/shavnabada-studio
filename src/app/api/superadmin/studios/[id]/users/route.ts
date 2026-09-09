import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

async function requireSuperAdminSession() {
  const session = await auth()
  if (!session?.user || (session.user as { role: string }).role !== 'super_admin') return null
  return session
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: studioId } = await params
  const { email, password } = await req.json() as { email: string; password: string }
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  const studio = await prisma.studio.findUnique({ where: { id: studioId } })
  if (!studio) return NextResponse.json({ error: 'Studio not found' }, { status: 404 })

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, passwordHash: hash, role: 'studio_admin', studioId },
    select: { id: true, email: true, role: true },
  })
  return NextResponse.json(user, { status: 201 })
}
