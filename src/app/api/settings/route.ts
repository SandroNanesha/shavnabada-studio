import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

function toResponse(s: { studioName: string; futureMonths: number; paymentDueDay: number; platformLogo: string; formLogo: string }) {
  return { studioName: s.studioName, futureMonths: s.futureMonths, paymentDueDay: s.paymentDueDay, platformLogo: s.platformLogo, formLogo: s.formLogo }
}

export async function GET() {
  const session = await auth()
  const studioId = (session?.user as { studioId?: string })?.studioId
  if (!studioId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const s = await prisma.settings.upsert({ where: { studioId }, update: {}, create: { studioId } })
    return NextResponse.json(toResponse(s))
  } catch (err) {
    console.error('[settings GET]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const studioId = (session?.user as { studioId?: string })?.studioId
  if (!studioId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json() as { studioName?: string; futureMonths?: number; paymentDueDay?: number; platformLogo?: string; formLogo?: string }

    const updated = await prisma.settings.upsert({
      where: { studioId },
      create: { studioId },
      update: {
        ...(body.studioName !== undefined ? { studioName: body.studioName } : {}),
        ...(body.futureMonths !== undefined ? { futureMonths: body.futureMonths } : {}),
        ...(body.paymentDueDay !== undefined ? { paymentDueDay: body.paymentDueDay } : {}),
        ...(body.platformLogo !== undefined ? { platformLogo: body.platformLogo } : {}),
        ...(body.formLogo !== undefined ? { formLogo: body.formLogo } : {}),
      },
    })
    return NextResponse.json(toResponse(updated))
  } catch (err) {
    console.error('[settings PATCH]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
