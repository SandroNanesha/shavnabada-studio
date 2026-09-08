import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ApplicationFormField } from '@/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const form = await prisma.applicationForm.findUnique({ where: { slug } })
    if (!form || !form.active) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }
    return NextResponse.json({
      id: form.id,
      title: form.title,
      fields: form.fields as unknown as ApplicationFormField[],
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const form = await prisma.applicationForm.findUnique({ where: { slug } })
    if (!form || !form.active) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const body = await req.json() as {
      firstName: string
      surname: string
      birthDate: string
      idNumber?: string
      parents: { name: string; phone: string }[]
      customValues: { label: string; value: string }[]
    }

    const { firstName, surname, birthDate, idNumber, parents, customValues } = body

    if (!firstName || !surname || !birthDate) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const application = await prisma.application.create({
      data: {
        pupilFirstName: firstName.trim(),
        pupilSurname: surname.trim(),
        birthDate,
        idNumber: idNumber?.trim() ?? '',
        status: 'pending',
        submittedAt: new Date().toISOString(),
        formId: form.id,
        studioId: form.studioId,
        parents: {
          create: (parents ?? []).map((p, i) => ({
            name: p.name,
            phone: p.phone ?? '',
            order: i,
          })),
        },
        customValues: {
          create: (customValues ?? []).map(cv => ({
            label: cv.label,
            value: cv.value,
          })),
        },
      },
    })

    return NextResponse.json({ id: application.id }, { status: 201 })
  } catch (err) {
    console.error('[apply POST]', err)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}
