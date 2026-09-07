export const dynamic = 'force-dynamic'

import { getLocations, getGroups, getTeachers } from '@/lib/data'
import GroupsClient from './GroupsClient'

export default async function GroupsPage() {
  const [locations, groups, teachers] = await Promise.all([
    getLocations(),
    getGroups(),
    getTeachers(),
  ])

  return (
    <GroupsClient
      initialLocations={locations}
      initialGroups={groups}
      initialTeachers={teachers}
    />
  )
}
