export const dynamic = 'force-dynamic'

import { getTeachers, getGroups } from '@/lib/data'
import TeachersClient from './TeachersClient'
import { requireStudioSession } from '@/lib/session'

export default async function TeachersPage() {
  const { studioId } = await requireStudioSession()
  const [teachers, groups] = await Promise.all([getTeachers(studioId), getGroups(studioId)])

  return <TeachersClient initialTeachers={teachers} groups={groups} />
}
