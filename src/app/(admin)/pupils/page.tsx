export const dynamic = 'force-dynamic'

import { getPupils, getGroups, getClassifications, getPayments } from '@/lib/data'
import PupilsView from '@/components/admin/pupils/PupilsView'

export default async function PupilsPage() {
  const [{ pupils, nextCursor }, groups, classifications, payments] = await Promise.all([
    getPupils(),
    getGroups(),
    getClassifications(),
    getPayments(),
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
