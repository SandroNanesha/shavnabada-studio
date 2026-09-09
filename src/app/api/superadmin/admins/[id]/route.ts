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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  // Prevent deleting yourself
  if ((session.user as { id: string }).id === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.user.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireSuperAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { password } = await req.json() as { password: string }
  if (!password || password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const hash = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id }, data: { passwordHash: hash } })
  return new NextResponse(null, { status: 204 })
}
