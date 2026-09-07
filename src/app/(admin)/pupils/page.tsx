import { getPupils, getGroups, getClassifications, getPayments } from '@/lib/data'
import PupilsView from '@/components/admin/pupils/PupilsView'

export default async function PupilsPage() {
  const [pupils, groups, classifications, payments] = await Promise.all([
    getPupils(),
    getGroups(),
    getClassifications(),
    getPayments(),
  ])

  return (
    <PupilsView
      pupils={pupils}
      groups={groups}
      classifications={classifications}
      payments={payments}
    />
  )
}
