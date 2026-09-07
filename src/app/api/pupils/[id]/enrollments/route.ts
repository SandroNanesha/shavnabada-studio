import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/pupils/[id]/enrollments
// Body: { groupId, startDate, classificationId?, firstMonthDueOverride? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pupilId } = await params
  const { groupId, startDate, classificationId, firstMonthDueOverride } = await req.json() as {
    groupId: string
    startDate: string
    classificationId?: string | null
    firstMonthDueOverride?: number
  }

  if (!groupId || !startDate) {
    return NextResponse.json({ error: 'groupId and startDate are required' }, { status: 400 })
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      pupilId,
      groupId,
      startDate,
      baseFee: 80,
      discount: 0,
      classificationId: classificationId ?? null,
      customTerms: '',
      billingActive: true,
      prorateFirstMonth: false,
      monthOverrides: {},
      monthPaidAmountOverrides: {},
      monthDueOverrides: firstMonthDueOverride != null && !isNaN(firstMonthDueOverride)
        ? { [startDate.slice(0, 7)]: firstMonthDueOverride }
        : {},
      ledgerComments: {},
      groupHistory: [],
      classificationHistory: [],
    },
  })

  return NextResponse.json({
    id: enrollment.id,
    groupId: enrollment.groupId,
    startDate: enrollment.startDate,
    endDate: enrollment.endDate,
    baseFee: enrollment.baseFee,
    discount: enrollment.discount,
    classificationId: enrollment.classificationId,
    customTerms: enrollment.customTerms,
    billingActive: enrollment.billingActive,
    prorateFirstMonth: enrollment.prorateFirstMonth,
    monthOverrides: {},
    monthPaidAmountOverrides: {},
    monthDueOverrides: enrollment.monthDueOverrides ?? {},
    ledgerComments: {},
    groupHistory: [],
    classificationHistory: [],
  }, { status: 201 })
}
