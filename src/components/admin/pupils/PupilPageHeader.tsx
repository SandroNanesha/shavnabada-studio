'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Pupil, Tag } from '@/types'
import { useLanguage } from '@/lib/i18n/context'
import { useAppState } from '@/lib/state/context'
import EditPupilModal from './EditPupilModal'

const CATEGORY_BADGE: Record<string, { label: string; bg: string; text: string } | null> = {
  standard: null,
  staff:    { label: 'Staff',    bg: '#ede9fe', text: '#6d28d9' },
  social:   { label: 'Social',   bg: '#dbeafe', text: '#1d4ed8' },
  flagged:  { label: 'Flagged',  bg: '#fee2e2', text: '#991b1b' },
}

interface PupilPageHeaderProps {
  pupil: Pupil
  pupilTags: Tag[]
}

export default function PupilPageHeader({ pupil, pupilTags }: PupilPageHeaderProps) {
  const { t } = useLanguage()
  const { pupilEdits, setPupilEdit, archivedOverrides, setArchivedOverride } = useAppState()
  const [showEditModal, setShowEditModal] = useState(false)

  const badge = CATEGORY_BADGE[pupil.category]
  const isArchived = pupil.id in archivedOverrides ? archivedOverrides[pupil.id] : pupil.archived

  // Merge any saved edits on top of the base pupil
  const edit = pupilEdits[pupil.id]
  const displayName = edit ? `${edit.firstName} ${edit.surname}` : `${pupil.firstName} ${pupil.surname}`
  const displayIdNumber = edit?.idNumber ?? pupil.idNumber
  const displayBirthDate = edit?.birthDate ?? pupil.birthDate
  const displayParents = edit?.parents ?? pupil.parents

  return (
    <>
      <Link href="/pupils" style={{ fontSize: 12, color: '#1d4ed8', textDecoration: 'none' }} className="hover:underline">
        {t('pupil_detail.back')}
      </Link>

      <div className="mt-3 mb-4">
        {/* Name + badges row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          {/* Name + inline badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <h1 className="text-xl font-bold text-gray-900" style={{ color: isArchived ? '#9ca3af' : undefined, margin: 0 }}>
              {displayName}
            </h1>
            {badge && (
              <span style={{ backgroundColor: badge.bg, color: badge.text, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {badge.label}
              </span>
            )}
            {isArchived && (
              <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {t('pupils.inactive')}
              </span>
            )}
            {displayIdNumber && (
              <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                {t('pupils.id_number')}: {displayIdNumber}
              </span>
            )}
            {pupilTags.map(tag => (
              <span key={tag.id} style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '1px 7px', borderRadius: 10, fontSize: 11, whiteSpace: 'nowrap' }}>
                {tag.label}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowEditModal(true)}
              style={{ padding: '6px 14px', fontSize: 11, borderRadius: 4, cursor: 'pointer', fontWeight: 600, border: '1px solid #d0d7de', backgroundColor: '#fff', color: '#374151', whiteSpace: 'nowrap' }}
            >
              {t('pupils.edit_pupil')}
            </button>
            <button
              onClick={() => {
                const next = !isArchived
                setArchivedOverride(pupil.id, next)
                fetch(`/api/pupils/${pupil.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ archived: next }),
                })
              }}
              style={{
                padding: '6px 14px', fontSize: 11, borderRadius: 4, cursor: 'pointer', fontWeight: 600,
                border: `1px solid ${isArchived ? '#bbf7d0' : '#fca5a5'}`,
                backgroundColor: isArchived ? '#f0fdf4' : '#fff5f5',
                color: isArchived ? '#166534' : '#dc2626',
                whiteSpace: 'nowrap',
              }}
            >
              {isArchived ? t('pupils.set_active') : t('pupils.set_inactive')}
            </button>
          </div>
        </div>

        {/* Parents read-only */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, backgroundColor: '#fff', padding: '10px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 6 }}>
            {t('pupil_detail.parents')}
          </div>
          {displayParents.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{t('pupil_detail.no_parents')}</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {displayParents.map((parent, i) => (
                <div key={i} style={{ fontSize: 12, color: '#374151' }}>
                  <span style={{ fontWeight: 600 }}>{parent.name}</span>
                  {parent.phone && <span style={{ color: '#6b7280', marginLeft: 6, fontFamily: 'monospace' }}>{parent.phone}</span>}
                </div>
              ))}
            </div>
          )}
          {displayBirthDate && (
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
              {t('pupil_detail.date')}: {displayBirthDate}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditPupilModal
          pupil={pupil}
          currentEdit={edit}
          onSave={data => {
            setPupilEdit(pupil.id, data)
            setShowEditModal(false)
            fetch(`/api/pupils/${pupil.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firstName: data.firstName,
                surname: data.surname,
                idNumber: data.idNumber,
                birthDate: data.birthDate,
                parents: data.parents,
              }),
            })
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  )
}
