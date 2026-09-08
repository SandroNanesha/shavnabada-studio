import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ApplicationFormField } from '@/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json() as { title?: string; fields?: ApplicationFormField[]; active?: boolean }

    const form = await prisma.applicationForm.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.fields !== undefined ? { fields: body.fields as object[] } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    })

    return NextResponse.json({
      id: form.id,
      title: form.title,
      slug: form.slug,
      fields: form.fields as unknown as ApplicationFormField[],
      active: form.active,
      createdAt: form.createdAt.toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.applicationForm.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 })
  }
}
