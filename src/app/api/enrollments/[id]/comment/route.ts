import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PATCH /api/enrollments/[id]/comment
// Body: { month: string, comment: string }
// Merges the single month's comment into the ledgerComments JSON field.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { month, comment } = body as { month: string; comment: string }

  if (!month || typeof month !== 'string') {
    return NextResponse.json({ error: 'month is required' }, { status: 400 })
  }

  const enrollment = await prisma.enrollment.findUnique({ where: { id } })
  if (!enrollment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const existing = (enrollment.ledgerComments ?? {}) as Record<string, string>
  const updated = { ...existing }

  if (comment) {
    updated[month] = comment
  } else {
    delete updated[month]
  }

  await prisma.enrollment.update({
    where: { id },
    data: { ledgerComments: updated },
  })

  return NextResponse.json({ ok: true })
}
