import { getApplications } from '@/lib/data'
import ApplicationsView from '@/components/admin/ApplicationsView'

export default async function ApplicationsPage() {
  const applications = await getApplications()
  return <ApplicationsView applications={applications} />
}
