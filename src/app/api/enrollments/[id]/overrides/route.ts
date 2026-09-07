import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PATCH /api/enrollments/[id]/overrides
// Body: {
//   month: string,
//   status?: MonthOverrideStatus | null,   (null clears the override)
//   customDue?: number | null,              (null clears)
//   customPaid?: number | null,             (null clears)
//   classificationId?: string | null,       (if present, updates classificationId directly)
// }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { month, status, customDue, customPaid, classificationId } = body as {
    month?: string
    status?: string | null
    customDue?: number | null
    customPaid?: number | null
    classificationId?: string | null
  }

  const enrollment = await prisma.enrollment.findUnique({ where: { id } })
  if (!enrollment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}

  if (month) {
    // status override
    if (status !== undefined) {
      const overrides = { ...(enrollment.monthOverrides as Record<string, string>) }
      if (status === null) {
        delete overrides[month]
      } else {
        overrides[month] = status
      }
      data.monthOverrides = overrides
    }

    // custom due override
    if (customDue !== undefined) {
      const dues = { ...(enrollment.monthDueOverrides as Record<string, number>) }
      if (customDue === null) {
        delete dues[month]
      } else {
        dues[month] = customDue
      }
      data.monthDueOverrides = dues
    }

    // custom paid override
    if (customPaid !== undefined) {
      const paids = { ...(enrollment.monthPaidAmountOverrides as Record<string, number>) }
      if (customPaid === null) {
        delete paids[month]
      } else {
        paids[month] = customPaid
      }
      data.monthPaidAmountOverrides = paids
    }
  }

  // classification change (no month needed)
  if ('classificationId' in body) {
    data.classificationId = classificationId ?? null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  await prisma.enrollment.update({ where: { id }, data })

  return NextResponse.json({ ok: true })
}
