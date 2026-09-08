import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// PATCH /api/enrollments/[id]
// Body: { endDate?, billingActive?, resumeDate?, classificationId?, firstMonthDueOverride? }
// When endDate=null + resumeDate: reactivates, auto-exempts gap months, optionally updates classification + first month due
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const studioId = (session?.user as { studioId?: string })?.studioId
  if (!studioId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as {
    endDate?: string | null
    billingActive?: boolean
    resumeDate?: string
    classificationId?: string | null
    firstMonthDueOverride?: number
  }

  const data: Record<string, unknown> = {}
  if ('billingActive' in body) data.billingActive = body.billingActive
  if ('classificationId' in body) data.classificationId = body.classificationId ?? null

  if ('endDate' in body && body.endDate === null && body.resumeDate) {
    // Reactivation
    const existing = await prisma.enrollment.findUnique({ where: { id }, include: { pupil: true } })
    if (!existing || existing.pupil.studioId !== studioId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    data.endDate = null

    const overrides = { ...(existing.monthOverrides as Record<string, string>) }
    const dueOverrides = { ...(existing.monthDueOverrides as Record<string, number>) }

    // Auto-exempt gap months
    if (existing.endDate) {
      const cur = new Date(existing.endDate)
      cur.setDate(1)
      cur.setMonth(cur.getMonth() + 1)
      const gapEnd = new Date(body.resumeDate)
      gapEnd.setDate(1)
      while (cur < gapEnd) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`
        if (!overrides[key]) overrides[key] = 'exempt'
        cur.setMonth(cur.getMonth() + 1)
      }
    }

    // Custom first resumed month due
    if (body.firstMonthDueOverride != null && !isNaN(body.firstMonthDueOverride)) {
      const resumeMonth = body.resumeDate.slice(0, 7)
      dueOverrides[resumeMonth] = body.firstMonthDueOverride
    }

    data.monthOverrides = overrides
    data.monthDueOverrides = dueOverrides
  } else if ('endDate' in body) {
    // Verify ownership for simple endDate updates
    const existing = await prisma.enrollment.findUnique({ where: { id }, include: { pupil: true } })
    if (!existing || existing.pupil.studioId !== studioId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    data.endDate = body.endDate ?? null
  } else {
    // Verify ownership for other updates (billingActive, classificationId)
    const existing = await prisma.enrollment.findUnique({ where: { id }, include: { pupil: true } })
    if (!existing || existing.pupil.studioId !== studioId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const enrollment = await prisma.enrollment.update({ where: { id }, data })

  return NextResponse.json({ id: enrollment.id, endDate: enrollment.endDate, billingActive: enrollment.billingActive })
}
