import { prisma } from '@/lib/db'
import SuperAdminClient from './SuperAdminClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const [studios, superAdmins] = await Promise.all([
    prisma.studio.findMany({
      include: { users: { select: { id: true, email: true, role: true }, where: { role: 'studio_admin' } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { role: 'super_admin' },
      select: { id: true, email: true, role: true },
      orderBy: { email: 'asc' },
    }),
  ])
  return <SuperAdminClient studios={studios} superAdmins={superAdmins} />
}
