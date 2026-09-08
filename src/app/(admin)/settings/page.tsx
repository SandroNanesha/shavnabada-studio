import SettingsClient from './SettingsClient'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getSettings() {
  let s = await prisma.settings.findUnique({ where: { id: 'singleton' } })
  if (!s) s = await prisma.settings.create({ data: { id: 'singleton' } })
  return {
    studioName: s.studioName,
    futureMonths: s.futureMonths,
    paymentDueDay: s.paymentDueDay,
    platformLogo: s.platformLogo,
    formLogo: s.formLogo,
  }
}

export default async function SettingsPage() {
  const settings = await getSettings()
  return <SettingsClient initialSettings={settings} />
}
