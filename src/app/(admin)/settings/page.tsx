import SettingsClient from './SettingsClient'
import { prisma } from '@/lib/db'
import { requireStudioSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { studioId } = await requireStudioSession()

  let s = await prisma.settings.findUnique({ where: { studioId } })
  if (!s) s = await prisma.settings.create({ data: { studioId } })

  const settings = {
    studioName: s.studioName,
    futureMonths: s.futureMonths,
    paymentDueDay: s.paymentDueDay,
    platformLogo: s.platformLogo,
    formLogo: s.formLogo,
  }

  return <SettingsClient initialSettings={settings} />
}
