import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireStudioSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const { id } = await requireStudioSession()
  const { currentPassword, newPassword } = await req.json() as { currentPassword: string; newPassword: string }

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'min8' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword ?? '', user.passwordHash)
  if (!valid) return NextResponse.json({ error: 'wrong_current' }, { status: 400 })

  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id }, data: { passwordHash: hash } })
  return new NextResponse(null, { status: 204 })
}
