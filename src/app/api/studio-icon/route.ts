import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    const role = (session?.user as { role?: string })?.role

    let studioId: string | null = null

    if (role === 'super_admin') {
      const cookieStore = await cookies()
      studioId = cookieStore.get('sa_studio_id')?.value ?? null
    } else {
      studioId = (session?.user as { studioId?: string })?.studioId ?? null
    }

    if (!studioId) return new NextResponse(null, { status: 404 })

    const settings = await prisma.settings.findUnique({ where: { studioId } })
    const logo = settings?.platformLogo

    if (!logo || !logo.startsWith('data:image/')) {
      return new NextResponse(null, { status: 404 })
    }

    // logo is a data URL: "data:image/png;base64,..."
    const [meta, base64] = logo.split(',')
    const mimeType = meta.split(':')[1].split(';')[0]
    const buffer = Buffer.from(base64, 'base64')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
