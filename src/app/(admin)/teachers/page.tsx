export const dynamic = 'force-dynamic'

import { getTeachers, getGroups } from '@/lib/data'
import TeachersClient from './TeachersClient'

export default async function TeachersPage() {
  const [teachers, groups] = await Promise.all([getTeachers(), getGroups()])

  return <TeachersClient initialTeachers={teachers} groups={groups} />
}
