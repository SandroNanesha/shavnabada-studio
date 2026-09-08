import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPupils } from '@/lib/data'
import { auth } from '@/auth'

// GET /api/pupils?cursor=<id>
export async function GET(req: NextRequest) {
  const session = await auth()
  const studioId = (session?.user as { studioId?: string })?.studioId
  if (!studioId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined
  const result = await getPupils(studioId, cursor)
  return NextResponse.json(result)
}

// POST /api/pupils
// Body: {
//   firstName, surname, idNumber, birthDate,
//   parents: { name, phone }[],
//   enrollments?: { groupId, startDate, classificationId?, firstMonthDueOverride? }[]
// }
export async function POST(req: NextRequest) {
  const session = await auth()
  const studioId = (session?.user as { studioId?: string })?.studioId
  if (!studioId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { firstName, surname, idNumber, birthDate, parents, enrollments, source } = body as {
    firstName: string
    surname: string
    idNumber: string
    birthDate: string
    parents: { name: string; phone: string }[]
    enrollments?: { groupId: string; startDate: string; classificationId?: string | null; firstMonthDueOverride?: number }[]
    source?: 'manual' | 'application'
  }

  if (!firstName?.trim() || !surname?.trim() || !idNumber?.trim()) {
    return NextResponse.json({ error: 'firstName, surname and idNumber are required' }, { status: 400 })
  }

  const existing = await prisma.pupil.findUnique({ where: { studioId_idNumber: { studioId, idNumber: idNumber.trim() } } })
  if (existing) {
    return NextResponse.json({ error: 'A pupil with this ID number already exists' }, { status: 409 })
  }

  const validEnrollments = (enrollments ?? []).filter(e => e.groupId)

  const pupil = await prisma.pupil.create({
    data: {
      firstName: firstName.trim(),
      surname: surname.trim(),
      idNumber: idNumber.trim(),
      birthDate: birthDate ?? '',
      source: source ?? 'manual',
      studioId,
      parents: {
        create: parents
          .filter(p => p.name.trim() || p.phone.trim())
          .map((p, i) => ({ name: p.name.trim(), phone: p.phone.trim(), order: i })),
      },
      enrollments: validEnrollments.length > 0
        ? {
            create: validEnrollments.map(e => ({
              groupId: e.groupId,
              startDate: e.startDate,
              baseFee: 80,
              discount: 0,
              classificationId: e.classificationId ?? null,
              customTerms: '',
              billingActive: true,
              prorateFirstMonth: false,
              monthOverrides: {},
              monthPaidAmountOverrides: {},
              monthDueOverrides: e.firstMonthDueOverride !== undefined && !isNaN(e.firstMonthDueOverride)
                ? { [e.startDate.slice(0, 7)]: e.firstMonthDueOverride }
                : {},
              ledgerComments: {},
              groupHistory: [],
              classificationHistory: [],
            })),
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
    source: pupil.source,
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
