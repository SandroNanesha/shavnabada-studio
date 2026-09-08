export const dynamic = 'force-dynamic'

import { getPupils, getGroups, getClassifications, getPayments } from '@/lib/data'
import PupilsView from '@/components/admin/pupils/PupilsView'
import { requireStudioSession } from '@/lib/session'

export default async function PupilsPage() {
  const { studioId } = await requireStudioSession()
  const [{ pupils, nextCursor }, groups, classifications, payments] = await Promise.all([
    getPupils(studioId),
    getGroups(studioId),
    getClassifications(studioId),
    getPayments(studioId),
  ])

  return (
    <PupilsView
      pupils={pupils}
      initialNextCursor={nextCursor}
      groups={groups}
      classifications={classifications}
      payments={payments}
    />
  )
}
