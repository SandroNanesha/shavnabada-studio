import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

async function requireSuperAdminSession() {
  const session = await auth()
  if (!session?.user || (session.user as { role: string }).role !== 'super_admin') return null
  return session
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  if (!await requireSuperAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: studioId, userId } = await params

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.studioId !== studioId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.user.delete({ where: { id: userId } })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  if (!await requireSuperAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: studioId, userId } = await params
  const { password } = await req.json() as { password: string }
  if (!password || password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.studioId !== studioId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const hash = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } })
  return new NextResponse(null, { status: 204 })
}
