import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ApplicationStatus } from '@prisma/client'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const studioId = (session?.user as { studioId?: string })?.studioId
  if (!studioId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const existing = await prisma.application.findUnique({ where: { id, studioId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.application.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[application DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const studioId = (session?.user as { studioId?: string })?.studioId
  if (!studioId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json() as { status: string }

    if (!['pending', 'approved', 'dismissed'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const existing = await prisma.application.findUnique({ where: { id, studioId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await prisma.application.update({
      where: { id },
      data: { status: body.status as ApplicationStatus },
    })

    return NextResponse.json({ id: updated.id, status: updated.status })
  } catch (err) {
    console.error('[application PATCH]', err)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}
