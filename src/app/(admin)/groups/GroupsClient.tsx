'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/context'
import type { Location, Group, Teacher } from '@/types'

type LocationModal =
  | { mode: 'add'; name: string }
  | { mode: 'edit'; location: Location; name: string }

interface GroupModalState {
  mode: 'add' | 'edit'
  group?: Group
  locationId: string
  name: string
  teacherIds: string[] // which teachers are assigned to this group
}

interface GroupsClientProps {
  initialLocations: Location[]
  initialGroups: Group[]
  initialTeachers: Teacher[]
}

export default function GroupsClient({ initialLocations, initialGroups, initialTeachers }: GroupsClientProps) {
  const { t } = useLanguage()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [teachersList, setTeachersList] = useState<Teacher[]>(initialTeachers)

  const [locationModal, setLocationModal] = useState<LocationModal | null>(null)
  const [groupModal, setGroupModal] = useState<GroupModalState | null>(null)
  const [nameError, setNameError] = useState('')

  // --- Location handlers ---
  const openAddLocation = () => {
    setNameError('')
    setLocationModal({ mode: 'add', name: '' })
  }
  const openEditLocation = (loc: Location) => {
    setNameError('')
    setLocationModal({ mode: 'edit', location: loc, name: loc.name })
  }
  const saveLocation = () => {
    if (!locationModal) return
    const name = locationModal.name.trim()
    if (!name) { setNameError(t('groups.name_required')); return }
    if (locationModal.mode === 'add') {
      setLocations(prev => [...prev, { id: `loc-${Date.now()}`, name }])
    } else {
      setLocations(prev => prev.map(l => l.id === locationModal.location.id ? { ...l, name } : l))
    }
    setLocationModal(null)
  }
  const deleteLocation = (id: string) => {
    const removedGroupIds = groups.filter(g => g.locationId === id).map(g => g.id)
    setLocations(prev => prev.filter(l => l.id !== id))
    setGroups(prev => prev.filter(g => g.locationId !== id))
    // Remove deleted groups from teachers' groupIds
    setTeachersList(prev => prev.map(tch => ({
      ...tch,
      groupIds: tch.groupIds.filter(gid => !removedGroupIds.includes(gid)),
    })))
    setLocationModal(null)
  }

  // --- Group handlers ---
  const openAddGroup = (locationId: string) => {
    setNameError('')
    setGroupModal({ mode: 'add', locationId, name: '', teacherIds: [] })
  }
  const openEditGroup = (group: Group) => {
    setNameError('')
    // Current teachers assigned to this group
    const current = teachersList.filter(tch => tch.groupIds.includes(group.id)).map(tch => tch.id)
    setGroupModal({ mode: 'edit', group, locationId: group.locationId, name: group.name, teacherIds: current })
  }
  const toggleGroupTeacher = (teacherId: string) => {
    setGroupModal(prev => {
      if (!prev) return prev
      const has = prev.teacherIds.includes(teacherId)
      return { ...prev, teacherIds: has ? prev.teacherIds.filter(id => id !== teacherId) : [...prev.teacherIds, teacherId] }
    })
  }
  const saveGroup = () => {
    if (!groupModal) return
    const name = groupModal.name.trim()
    if (!name) { setNameError(t('groups.name_required')); return }

    let groupId: string
    if (groupModal.mode === 'add') {
      groupId = `grp-${Date.now()}`
      setGroups(prev => [...prev, { id: groupId, name, locationId: groupModal.locationId }])
    } else {
      groupId = groupModal.group!.id
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name } : g))
    }

    // Update teachers: add or remove groupId from their groupIds
    setTeachersList(prev => prev.map(tch => {
      const shouldHave = groupModal.teacherIds.includes(tch.id)
      const hasNow = tch.groupIds.includes(groupId)
      if (shouldHave && !hasNow) return { ...tch, groupIds: [...tch.groupIds, groupId] }
      if (!shouldHave && hasNow) return { ...tch, groupIds: tch.groupIds.filter(id => id !== groupId) }
      return tch
    }))

    setGroupModal(null)
  }
  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id))
    setTeachersList(prev => prev.map(tch => ({ ...tch, groupIds: tch.groupIds.filter(gid => gid !== id) })))
    setGroupModal(null)
  }

  // --- Styles ---
  const th: React.CSSProperties = { border: '1px solid #d0d7de', padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }
  const td: React.CSSProperties = { border: '1px solid #d0d7de', padding: '7px 12px' }
  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', padding: '6px 10px', fontSize: 12,
    border: `1px solid ${hasError ? '#f87171' : '#d0d7de'}`,
    borderRadius: 4, outline: 'none', boxSizing: 'border-box',
  })

  const backdropStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: '#fff', display: 'flex', alignItems: 'stretch', justifyContent: 'stretch' }
    : { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }

  const modalBase: React.CSSProperties = isMobile
    ? { backgroundColor: '#fff', width: '100%', height: '100%', maxHeight: '100dvh', overflow: 'auto', display: 'flex', flexDirection: 'column' }
    : { backgroundColor: '#fff', border: '1px solid #d0d7de', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: '100%', display: 'flex', flexDirection: 'column' }

  const headerRadius = isMobile ? 0 : '6px 6px 0 0'
  const footerRadius = isMobile ? 0 : '0 0 6px 6px'

  return (
    <div className="p-4">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
          {t('groups.title')}
        </h1>
        <button
          onClick={openAddLocation}
          style={{
            backgroundColor: '#1e293b', color: '#fff', border: 'none',
            borderRadius: 4, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {t('groups.add_location_btn')}
        </button>
      </div>

      <div className="space-y-4">
        {locations.map(location => {
          const locationGroups = groups.filter(g => g.locationId === location.id)

          return (
            <div key={location.id} style={{ border: '1px solid #d0d7de', borderRadius: 4, overflow: 'hidden' }}>
              {/* Location header */}
              <div style={{
                backgroundColor: '#1e293b', color: '#fff', padding: '8px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{location.name}</span>
                  <button
                    onClick={() => openEditLocation(location)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 11, padding: 0 }}
                  >
                    {t('common.edit')}
                  </button>
                </div>
                <button
                  onClick={() => openAddGroup(location.id)}
                  style={{
                    backgroundColor: '#334155', color: '#e2e8f0',
                    border: '1px solid #475569', borderRadius: 3,
                    padding: '4px 12px', fontSize: 11, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('groups.add_group_btn')}
                </button>
              </div>

              {locationGroups.length === 0 ? (
                <div style={{ padding: '10px 20px', fontSize: 12, color: '#9ca3af' }}>
                  {t('groups.no_groups')}
                </div>
              ) : (
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12, minWidth: 400 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f6f8fa' }}>
                        <th style={{ ...th, paddingLeft: 28 }}>{t('groups.group')}</th>
                        <th style={th}>{t('groups.teacher')}</th>
                        <th style={th}>{t('groups.role')}</th>
                        <th style={{ ...th, width: 60 }}>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationGroups.map(group => {
                        const groupTeachers = teachersList.filter(tch => tch.groupIds.includes(group.id))
                        return (
                          <tr key={group.id} style={{ backgroundColor: '#fff' }}>
                            <td style={{ ...td, color: '#111827', fontWeight: 500, paddingLeft: 28 }}>
                              {group.name}
                            </td>
                            <td style={{ ...td, color: '#374151' }}>
                              {groupTeachers.length === 0
                                ? <span style={{ color: '#9ca3af' }}>{t('groups.no_teacher')}</span>
                                : groupTeachers.map(tch => tch.name).join(', ')
                              }
                            </td>
                            <td style={{ ...td, color: '#6b7280' }}>
                              {groupTeachers.map(tch =>
                                tch.role === 'Principal' ? t('teachers.role_principal') : t('teachers.role_assistant')
                              ).join(', ')}
                            </td>
                            <td style={{ ...td, textAlign: 'center' }}>
                              <button
                                onClick={() => openEditGroup(group)}
                                style={{ color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, padding: 0 }}
                              >
                                {t('common.edit')}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}

        {locations.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
            {t('common.no_data')}
          </div>
        )}
      </div>

      {/* Location modal */}
      {locationModal && (
        <div
          onClick={e => { if (!isMobile && e.target === e.currentTarget) setLocationModal(null) }}
          style={backdropStyle}
        >
          <div style={{ ...modalBase, maxWidth: isMobile ? undefined : 360 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid #d0d7de',
              backgroundColor: '#f6f8fa', borderRadius: headerRadius, flexShrink: 0,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>
                {locationModal.mode === 'add' ? t('groups.add_location') : t('groups.edit_location')}
              </div>
              <button onClick={() => setLocationModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280', lineHeight: 1, padding: '2px 6px' }}>×</button>
            </div>
            <div style={{ padding: 16, flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                {t('groups.location_name')}
              </label>
              <input
                type="text"
                value={locationModal.name}
                onChange={e => { setLocationModal(prev => prev ? { ...prev, name: e.target.value } : prev); setNameError('') }}
                placeholder={t('groups.location_placeholder')}
                style={inputStyle(!!nameError)}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') saveLocation(); if (e.key === 'Escape') setLocationModal(null) }}
              />
              {nameError && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{nameError}</div>}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 16px', borderTop: '1px solid #d0d7de',
              backgroundColor: '#f6f8fa', borderRadius: footerRadius, flexShrink: 0,
            }}>
              <div>
                {locationModal.mode === 'edit' && (
                  <button onClick={() => deleteLocation(locationModal.location.id)} style={{
                    padding: '5px 12px', fontSize: 12, borderRadius: 4,
                    border: '1px solid #fca5a5', backgroundColor: '#fff', color: '#dc2626', cursor: 'pointer',
                  }}>
                    {t('common.delete')}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setLocationModal(null)} style={{
                  padding: '5px 14px', fontSize: 12, borderRadius: 4,
                  border: '1px solid #d0d7de', backgroundColor: '#fff', color: '#374151', cursor: 'pointer',
                }}>
                  {t('common.cancel')}
                </button>
                <button onClick={saveLocation} style={{
                  padding: '5px 14px', fontSize: 12, borderRadius: 4,
                  border: 'none', backgroundColor: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 600,
                }}>
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group modal */}
      {groupModal && (
        <div
          onClick={e => { if (!isMobile && e.target === e.currentTarget) setGroupModal(null) }}
          style={backdropStyle}
        >
          <div style={{ ...modalBase, maxWidth: isMobile ? undefined : 400 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid #d0d7de',
              backgroundColor: '#f6f8fa', borderRadius: headerRadius, flexShrink: 0,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>
                {groupModal.mode === 'add' ? t('groups.add_group') : t('groups.edit_group')}
              </div>
              <button onClick={() => setGroupModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280', lineHeight: 1, padding: '2px 6px' }}>×</button>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflow: 'auto' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  {t('groups.group_name')}
                </label>
                <input
                  type="text"
                  value={groupModal.name}
                  onChange={e => { setGroupModal(prev => prev ? { ...prev, name: e.target.value } : prev); setNameError('') }}
                  placeholder={t('groups.group_placeholder')}
                  style={inputStyle(!!nameError)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Escape') setGroupModal(null) }}
                />
                {nameError && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{nameError}</div>}
              </div>

              {/* Teachers */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  {t('groups.teacher')}
                </label>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 4,
                  padding: '6px 8px', border: '1px solid #d0d7de', borderRadius: 4,
                }}>
                  {teachersList.length === 0 ? (
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{t('groups.no_teacher')}</span>
                  ) : teachersList.map(tch => {
                    const checked = groupModal.teacherIds.includes(tch.id)
                    return (
                      <label key={tch.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, padding: '2px 0' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleGroupTeacher(tch.id)}
                          style={{ accentColor: '#2563eb', cursor: 'pointer', width: 16, height: 16 }}
                        />
                        <span style={{ color: '#111827' }}>{tch.name}</span>
                        <span style={{
                          fontSize: 10, color: tch.role === 'Principal' ? '#6d28d9' : '#6b7280',
                          backgroundColor: tch.role === 'Principal' ? '#ede9fe' : '#f3f4f6',
                          padding: '1px 5px', borderRadius: 8, fontWeight: 600,
                        }}>
                          {tch.role === 'Principal' ? t('teachers.role_principal') : t('teachers.role_assistant')}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 16px', borderTop: '1px solid #d0d7de',
              backgroundColor: '#f6f8fa', borderRadius: footerRadius, flexShrink: 0,
            }}>
              <div>
                {groupModal.mode === 'edit' && (
                  <button onClick={() => deleteGroup(groupModal.group!.id)} style={{
                    padding: '5px 12px', fontSize: 12, borderRadius: 4,
                    border: '1px solid #fca5a5', backgroundColor: '#fff', color: '#dc2626', cursor: 'pointer',
                  }}>
                    {t('common.delete')}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setGroupModal(null)} style={{
                  padding: '5px 14px', fontSize: 12, borderRadius: 4,
                  border: '1px solid #d0d7de', backgroundColor: '#fff', color: '#374151', cursor: 'pointer',
                }}>
                  {t('common.cancel')}
                </button>
                <button onClick={saveGroup} style={{
                  padding: '5px 14px', fontSize: 12, borderRadius: 4,
                  border: 'none', backgroundColor: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 600,
                }}>
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
