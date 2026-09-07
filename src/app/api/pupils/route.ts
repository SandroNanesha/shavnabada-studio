import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPupils } from '@/lib/data'

// GET /api/pupils?cursor=<id>
export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined
  const result = await getPupils(cursor)
  return NextResponse.json(result)
}

// POST /api/pupils
// Body: {
//   firstName, surname, idNumber, birthDate,
//   parents: { name, phone }[],
//   enrollment?: { groupId, startDate, classificationId? }
// }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { firstName, surname, idNumber, birthDate, parents, enrollment } = body as {
    firstName: string
    surname: string
    idNumber: string
    birthDate: string
    parents: { name: string; phone: string }[]
    enrollment?: { groupId: string; startDate: string; classificationId?: string | null; firstMonthDueOverride?: number }
  }

  if (!firstName?.trim() || !surname?.trim() || !idNumber?.trim()) {
    return NextResponse.json({ error: 'firstName, surname and idNumber are required' }, { status: 400 })
  }

  const existing = await prisma.pupil.findUnique({ where: { idNumber: idNumber.trim() } })
  if (existing) {
    return NextResponse.json({ error: 'A pupil with this ID number already exists' }, { status: 409 })
  }

  const pupil = await prisma.pupil.create({
    data: {
      firstName: firstName.trim(),
      surname: surname.trim(),
      idNumber: idNumber.trim(),
      birthDate: birthDate ?? '',
      parents: {
        create: parents
          .filter(p => p.name.trim() || p.phone.trim())
          .map((p, i) => ({ name: p.name.trim(), phone: p.phone.trim(), order: i })),
      },
      enrollments: enrollment?.groupId
        ? {
            create: [{
              groupId: enrollment.groupId,
              startDate: enrollment.startDate,
              baseFee: 80,
              discount: 0,
              classificationId: enrollment.classificationId ?? null,
              customTerms: '',
              billingActive: true,
              prorateFirstMonth: false,
              monthOverrides: {},
              monthPaidAmountOverrides: {},
              monthDueOverrides: enrollment.firstMonthDueOverride !== undefined && !isNaN(enrollment.firstMonthDueOverride)
                ? { [enrollment.startDate.slice(0, 7)]: enrollment.firstMonthDueOverride }
                : {},
              ledgerComments: {},
              groupHistory: [],
              classificationHistory: [],
            }],
          }
        : undefined,
    },
    include: {
      parents: { orderBy: { order: 'asc' } },
      notes: true,
      tags: true,
      enrollments: true,
    },
  })

  return NextResponse.json({
    id: pupil.id,
    firstName: pupil.firstName,
    surname: pupil.surname,
    idNumber: pupil.idNumber,
    birthDate: pupil.birthDate,
    category: pupil.category,
    condition: pupil.condition,
    archived: pupil.archived,
    tagIds: pupil.tags.map(t => t.tagId),
    parents: pupil.parents.map(p => ({ name: p.name, phone: p.phone })),
    notes: [],
    enrollments: pupil.enrollments.map(e => ({
      id: e.id,
      groupId: e.groupId,
      startDate: e.startDate,
      endDate: e.endDate,
      baseFee: e.baseFee,
      discount: e.discount,
      classificationId: e.classificationId,
      customTerms: e.customTerms,
      billingActive: e.billingActive,
      prorateFirstMonth: e.prorateFirstMonth,
      monthOverrides: e.monthOverrides ?? {},
      monthPaidAmountOverrides: e.monthPaidAmountOverrides ?? {},
      monthDueOverrides: e.monthDueOverrides ?? {},
      ledgerComments: e.ledgerComments ?? {},
      groupHistory: e.groupHistory ?? [],
      classificationHistory: e.classificationHistory ?? [],
    })),
  }, { status: 201 })
}
