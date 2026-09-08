import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

async function getOrCreate() {
  let s = await prisma.settings.findUnique({ where: { id: 'singleton' } })
  if (!s) s = await prisma.settings.create({ data: { id: 'singleton' } })
  return s
}

function toResponse(s: { studioName: string; futureMonths: number; paymentDueDay: number; platformLogo: string; formLogo: string }) {
  return { studioName: s.studioName, futureMonths: s.futureMonths, paymentDueDay: s.paymentDueDay, platformLogo: s.platformLogo, formLogo: s.formLogo }
}

export async function GET() {
  try {
    const s = await getOrCreate()
    return NextResponse.json(toResponse(s))
  } catch (err) {
    console.error('[settings GET]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { studioName?: string; futureMonths?: number; paymentDueDay?: number; platformLogo?: string; formLogo?: string }
    await getOrCreate()
    const updated = await prisma.settings.update({
      where: { id: 'singleton' },
      data: {
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
