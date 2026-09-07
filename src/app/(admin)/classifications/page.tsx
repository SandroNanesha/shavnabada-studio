import { getClassifications } from '@/lib/data'
import ClassificationsView from '@/components/admin/ClassificationsView'

export default async function ClassificationsPage() {
  const classifications = await getClassifications()
  return <ClassificationsView initialClassifications={classifications} />
}
