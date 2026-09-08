import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// PATCH /api/pupils/[id]
// Body (all fields optional):
//   firstName?, surname?, idNumber?, birthDate?,
//   parents?: { name, phone }[],
//   archived?: boolean
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const studioId = (session?.user as { studioId?: string })?.studioId
  if (!studioId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { firstName, surname, idNumber, birthDate, parents, archived } = body as {
    firstName?: string
    surname?: string
    idNumber?: string
    birthDate?: string
    parents?: { name: string; phone: string }[]
    archived?: boolean
  }

  const pupil = await prisma.pupil.findUnique({ where: { id, studioId } })
  if (!pupil) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Check idNumber uniqueness if it's being changed
  if (idNumber !== undefined && idNumber.trim() !== pupil.idNumber) {
    const conflict = await prisma.pupil.findUnique({ where: { studioId_idNumber: { studioId: pupil.studioId, idNumber: idNumber.trim() } } })
    if (conflict) {
      return NextResponse.json({ error: 'A pupil with this ID number already exists' }, { status: 409 })
    }
  }

  const data: Record<string, unknown> = {}
  if (firstName !== undefined) data.firstName = firstName.trim()
  if (surname !== undefined) data.surname = surname.trim()
  if (idNumber !== undefined) data.idNumber = idNumber.trim()
  if (birthDate !== undefined) data.birthDate = birthDate
  if (archived !== undefined) data.archived = archived

  await prisma.$transaction(async tx => {
    if (Object.keys(data).length > 0) {
      await tx.pupil.update({ where: { id }, data })
    }

    if (parents !== undefined) {
      await tx.pupilParent.deleteMany({ where: { pupilId: id } })
      if (parents.length > 0) {
        await tx.pupilParent.createMany({
          data: parents
            .filter(p => p.name.trim() || p.phone.trim())
            .map((p, i) => ({
              pupilId: id,
              name: p.name.trim(),
              phone: p.phone.trim(),
              order: i,
            })),
        })
      }
    }
  })

  return NextResponse.json({ ok: true })
}
