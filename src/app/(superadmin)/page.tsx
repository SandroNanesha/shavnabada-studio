import { prisma } from '@/lib/db'
import SuperAdminClient from './SuperAdminClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const studios = await prisma.studio.findMany({
    include: { users: { select: { id: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return <SuperAdminClient studios={studios} />
}
