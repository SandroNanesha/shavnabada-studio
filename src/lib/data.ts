import { prisma } from '@/lib/db'
import type {
  Pupil,
  Group,
  Location,
  Teacher,
  PaymentClassification,
  Payment,
  Application,
  ApplicationForm,
  ApplicationFormField,
  Enrollment,
  PupilParent,
  PupilNote,
  MonthOverrideStatus,
  EnrollmentGroupHistory,
  EnrollmentClassificationHistory,
} from '@/types'

// ---- helpers ----

function toEnrollment(e: {
  id: string
  groupId: string
  startDate: string
  endDate: string | null
  baseFee: number
  discount: number
  classificationId: string | null
  customTerms: string
  billingActive: boolean
  prorateFirstMonth: boolean
  monthOverrides: unknown
  monthPaidAmountOverrides: unknown
  monthDueOverrides: unknown
  ledgerComments: unknown
  groupHistory: unknown
  classificationHistory: unknown
}): Enrollment {
  return {
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
    monthOverrides: (e.monthOverrides ?? {}) as Record<string, MonthOverrideStatus>,
    monthPaidAmountOverrides: (e.monthPaidAmountOverrides ?? {}) as Record<string, number>,
    monthDueOverrides: (e.monthDueOverrides ?? {}) as Record<string, number>,
    ledgerComments: (e.ledgerComments ?? {}) as Record<string, string>,
    groupHistory: (e.groupHistory ?? []) as EnrollmentGroupHistory[],
    classificationHistory: (e.classificationHistory ?? []) as EnrollmentClassificationHistory[],
  }
}

// ---- query functions ----

const PUPILS_PAGE_SIZE = 100

function mapPupilRow(row: {
  id: string; firstName: string; surname: string; idNumber: string; birthDate: string
  category: string; condition: string; archived: boolean; source: string
  tags: { tagId: string }[]
  parents: { name: string; phone: string }[]
  notes: { id: string; date: string; text: string }[]
  enrollments: Parameters<typeof toEnrollment>[0][]
}): Pupil {
  return {
    id: row.id,
    firstName: row.firstName,
    surname: row.surname,
    idNumber: row.idNumber,
    birthDate: row.birthDate,
    category: row.category as Pupil['category'],
    condition: row.condition,
    archived: row.archived,
    source: (row.source as Pupil['source']) ?? 'manual',
    tagIds: row.tags.map(t => t.tagId),
    parents: row.parents.map(p => ({ name: p.name, phone: p.phone })) as PupilParent[],
    notes: row.notes.map(n => ({ id: n.id, date: n.date, text: n.text })) as PupilNote[],
    enrollments: row.enrollments.map(toEnrollment),
  }
}

const PUPIL_INCLUDE = {
  parents: { orderBy: { order: 'asc' } },
  notes: { orderBy: { date: 'asc' } },
  tags: true,
  enrollments: true,
} as const

export async function getPupils(studioId: string, cursor?: string): Promise<{ pupils: Pupil[]; nextCursor: string | null }> {
  const rows = await prisma.pupil.findMany({
    take: PUPILS_PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: { studioId },
    include: PUPIL_INCLUDE,
    orderBy: [{ surname: 'asc' }, { id: 'asc' }],
  })

  const hasMore = rows.length > PUPILS_PAGE_SIZE
  const page = hasMore ? rows.slice(0, PUPILS_PAGE_SIZE) : rows
  return {
    pupils: page.map(mapPupilRow),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  }
}

export async function getPupil(studioId: string, id: string): Promise<Pupil | null> {
  const row = await prisma.pupil.findUnique({
    where: { id, studioId },
    include: {
      parents: { orderBy: { order: 'asc' } },
      notes: { orderBy: { date: 'asc' } },
      tags: true,
      enrollments: true,
    },
  })

  if (!row) return null

  return {
    id: row.id,
    firstName: row.firstName,
    surname: row.surname,
    idNumber: row.idNumber,
    birthDate: row.birthDate,
    category: row.category as Pupil['category'],
    condition: row.condition,
    archived: row.archived,
    source: (row.source as Pupil['source']) ?? 'manual',
    tagIds: row.tags.map(t => t.tagId),
    parents: row.parents.map(p => ({ name: p.name, phone: p.phone })) as PupilParent[],
    notes: row.notes.map(n => ({ id: n.id, date: n.date, text: n.text })) as PupilNote[],
    enrollments: row.enrollments.map(toEnrollment),
  }
}

export async function getGroups(studioId: string): Promise<Group[]> {
  const rows = await prisma.group.findMany({ where: { studioId }, orderBy: { name: 'asc' } })
  return rows.map(r => ({ id: r.id, name: r.name, locationId: r.locationId }))
}

export async function getLocations(studioId: string): Promise<Location[]> {
  const rows = await prisma.location.findMany({ where: { studioId }, orderBy: { name: 'asc' } })
  return rows.map(r => ({ id: r.id, name: r.name }))
}

export async function getTeachers(studioId: string): Promise<Teacher[]> {
  const rows = await prisma.teacher.findMany({
    where: { studioId },
    include: { groups: true },
    orderBy: { name: 'asc' },
  })
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    contact: r.contact,
    role: r.role as Teacher['role'],
    groupIds: r.groups.map(g => g.groupId),
  }))
}

export async function getClassifications(studioId: string): Promise<PaymentClassification[]> {
  const rows = await prisma.paymentClassification.findMany({ where: { studioId }, orderBy: { name: 'asc' } })
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type as PaymentClassification['type'],
    value: r.value,
  }))
}

export async function getPayments(studioId: string): Promise<Payment[]> {
  const rows = await prisma.payment.findMany({
    where: { pupil: { studioId } },
    orderBy: { date: 'asc' },
  })
  return rows.map(r => ({
    id: r.id,
    pupilId: r.pupilId,
    enrollmentId: r.enrollmentId,
    amount: r.amount,
    date: r.date,
  }))
}

export async function getApplications(studioId: string): Promise<Application[]> {
  const rows = await prisma.application.findMany({
    where: { studioId },
    include: {
      parents: { orderBy: { order: 'asc' } },
      customValues: true,
    },
    orderBy: { submittedAt: 'desc' },
  })
  return rows.map(r => ({
    id: r.id,
    pupilFirstName: r.pupilFirstName,
    pupilSurname: r.pupilSurname,
    birthDate: r.birthDate,
    idNumber: r.idNumber,
    documentFilename: r.documentFilename,
    status: r.status as Application['status'],
    submittedAt: r.submittedAt,
    formId: r.formId,
    parents: r.parents.map(p => ({ name: p.name, phone: p.phone })),
    customValues: r.customValues.map(v => ({ label: v.label, value: v.value })),
  }))
}

export async function getForms(studioId: string): Promise<ApplicationForm[]> {
  const rows = await prisma.applicationForm.findMany({ where: { studioId }, orderBy: { createdAt: 'desc' } })
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    fields: r.fields as unknown as ApplicationFormField[],
    active: r.active,
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function getTags(studioId: string) {
  const rows = await prisma.tag.findMany({ where: { studioId }, orderBy: { label: 'asc' } })
  return rows.map(r => ({ id: r.id, label: r.label }))
}
