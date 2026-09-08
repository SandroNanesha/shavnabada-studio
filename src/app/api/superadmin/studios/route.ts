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
  const studios = await prisma.studio.findMany({
    include: { users: { select: { id: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(studios)
}

export async function POST(req: NextRequest) {
  if (!await requireSuperAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, slug, email, password } = await req.json() as { name: string; slug: string; email: string; password: string }
  if (!name || !slug || !email || !password) return NextResponse.json({ error: 'All fields required' }, { status: 400 })

  const existing = await prisma.studio.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })

  const hash = await bcrypt.hash(password, 12)

  const studio = await prisma.$transaction(async (tx) => {
    const s = await tx.studio.create({ data: { name, slug } })
    await tx.user.create({ data: { email, passwordHash: hash, role: 'studio_admin', studioId: s.id } })
    await tx.settings.create({ data: { studioId: s.id } })
    return s
  })

  const full = await prisma.studio.findUnique({
    where: { id: studio.id },
    include: { users: { select: { id: true, email: true, role: true } } },
  })
  return NextResponse.json(full, { status: 201 })
}
