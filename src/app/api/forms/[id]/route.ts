import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import type { ApplicationFormField } from '@/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const studioId = (session?.user as { studioId?: string })?.studioId
  if (!studioId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json() as { title?: string; fields?: ApplicationFormField[]; disabledPredefined?: string[]; active?: boolean }

    const existing = await prisma.applicationForm.findUnique({ where: { id, studioId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const form = await prisma.applicationForm.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.fields !== undefined ? { fields: body.fields as object[] } : {}),
        ...(body.disabledPredefined !== undefined ? { disabledPredefined: body.disabledPredefined as unknown as object[] } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    })

    return NextResponse.json({
      id: form.id,
      title: form.title,
      slug: form.slug,
      fields: form.fields as unknown as ApplicationFormField[],
      disabledPredefined: (form.disabledPredefined as unknown as string[]) ?? [],
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
  const session = await auth()
  const studioId = (session?.user as { studioId?: string })?.studioId
  if (!studioId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const existing = await prisma.applicationForm.findUnique({ where: { id, studioId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.applicationForm.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 })
  }
}
