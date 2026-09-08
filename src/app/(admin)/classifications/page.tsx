export const dynamic = 'force-dynamic'

import { getClassifications } from '@/lib/data'
import ClassificationsView from '@/components/admin/ClassificationsView'
import { requireStudioSession } from '@/lib/session'

export default async function ClassificationsPage() {
  const { studioId } = await requireStudioSession()
  const classifications = await getClassifications(studioId)
  return <ClassificationsView initialClassifications={classifications} />
}
