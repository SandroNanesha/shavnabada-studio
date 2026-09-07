export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getPupil, getGroups, getClassifications, getPayments, getTags } from '@/lib/data'
import PupilDetail from '@/components/admin/pupils/PupilDetail'
import PupilPageHeader from '@/components/admin/pupils/PupilPageHeader'

export default async function PupilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [pupil, groups, classifications, payments, tags] = await Promise.all([
    getPupil(id),
    getGroups(),
    getClassifications(),
    getPayments(),
    getTags(),
  ])

  if (!pupil) notFound()

  const pupilTags = tags.filter(t => pupil.tagIds.includes(t.id))

  return (
    <div className="p-4">
      <PupilPageHeader pupil={pupil} pupilTags={pupilTags} />

      <PupilDetail
        pupil={pupil}
        groups={groups}
        classifications={classifications}
        payments={payments}
      />
    </div>
  )
}
