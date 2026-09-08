export const dynamic = 'force-dynamic'

import { getLocations, getGroups, getTeachers } from '@/lib/data'
import GroupsClient from './GroupsClient'
import { requireStudioSession } from '@/lib/session'

export default async function GroupsPage() {
  const { studioId } = await requireStudioSession()
  const [locations, groups, teachers] = await Promise.all([
    getLocations(studioId),
    getGroups(studioId),
    getTeachers(studioId),
  ])

  return (
    <GroupsClient
      initialLocations={locations}
      initialGroups={groups}
      initialTeachers={teachers}
    />
  )
}
