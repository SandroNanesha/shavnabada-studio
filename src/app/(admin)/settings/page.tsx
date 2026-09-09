import SettingsClient from './SettingsClient'
import { prisma } from '@/lib/db'
import { requireStudioSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { studioId } = await requireStudioSession()

  const s = await prisma.settings.upsert({
    where: { studioId },
    update: {},
    create: { studioId },
  })

  const settings = {
    studioName: s.studioName,
    futureMonths: s.futureMonths,
    paymentDueDay: s.paymentDueDay,
    platformLogo: s.platformLogo,
    formLogo: s.formLogo,
  }

  return <SettingsClient initialSettings={settings} />
}
