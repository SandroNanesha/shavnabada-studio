export const dynamic = 'force-dynamic'

import { getApplications, getForms, getGroups, getClassifications } from '@/lib/data'
import ApplicationsView from '@/components/admin/ApplicationsView'
import { requireStudioSession } from '@/lib/session'

export default async function ApplicationsPage() {
  const { studioId } = await requireStudioSession()
  const [applications, forms, groups, classifications] = await Promise.all([
    getApplications(studioId),
    getForms(studioId),
    getGroups(studioId),
    getClassifications(studioId),
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
