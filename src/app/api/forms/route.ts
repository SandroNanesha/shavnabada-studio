import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ApplicationFormField } from '@/types'

export async function GET() {
  try {
    const rows = await prisma.applicationForm.findMany({ orderBy: { createdAt: 'desc' } })
    const forms = rows.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      fields: r.fields as unknown as ApplicationFormField[],
      active: r.active,
      createdAt: r.createdAt.toISOString(),
    }))
    return NextResponse.json(forms)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { title: string; fields: ApplicationFormField[] }
    const { title, fields } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const slug =
      title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
      '-' +
      Date.now()

    const form = await prisma.applicationForm.create({
      data: {
        title: title.trim(),
        slug,
        fields: (fields ?? []) as object[],
        active: true,
      },
    })

    return NextResponse.json({
      id: form.id,
      title: form.title,
      slug: form.slug,
      fields: form.fields as unknown as ApplicationFormField[],
      active: form.active,
      createdAt: form.createdAt.toISOString(),
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 })
  }
}
