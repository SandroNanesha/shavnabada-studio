import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

async function requireSuperAdminSession() {
  const session = await auth()
  if (!session?.user || (session.user as { role: string }).role !== 'super_admin') return null
  return session
}

export async function GET() {
  if (!await requireSuperAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admins = await prisma.user.findMany({
    where: { role: 'super_admin' },
    select: { id: true, email: true, role: true },
    orderBy: { email: 'asc' },
  })
  return NextResponse.json(admins)
}

export async function POST(req: NextRequest) {
  if (!await requireSuperAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { email, password } = await req.json() as { email: string; password: string }
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, passwordHash: hash, role: 'super_admin', studioId: null },
    select: { id: true, email: true, role: true },
  })
  return NextResponse.json(user, { status: 201 })
}
