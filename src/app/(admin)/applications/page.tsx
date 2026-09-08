export const dynamic = 'force-dynamic'

import { getApplications, getForms, getGroups, getClassifications } from '@/lib/data'
import ApplicationsView from '@/components/admin/ApplicationsView'

export default async function ApplicationsPage() {
  const [applications, forms, groups, classifications] = await Promise.all([
    getApplications(),
    getForms(),
    getGroups(),
    getClassifications(),
  ])
  return (
    <ApplicationsView
      applications={applications}
      forms={forms}
      groups={groups}
      classifications={classifications}
    />
  )
}
