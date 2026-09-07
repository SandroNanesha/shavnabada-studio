'use client'

import { useState } from 'react'
import type { Application, ApplicationStatus } from '@/types'
import { useLanguage } from '@/lib/i18n/context'

interface ApplicationsViewProps {
  applications: Application[]
}

const STATUS_BADGE: Record<ApplicationStatus, { bg: string; text: string }> = {
  pending: { bg: '#fef9c3', text: '#854d0e' },
  approved: { bg: '#dcfce7', text: '#166534' },
  dismissed: { bg: '#fee2e2', text: '#991b1b' },
}

export default function ApplicationsView({ applications }: ApplicationsViewProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<ApplicationStatus>('pending')

  const tabs: ApplicationStatus[] = ['pending', 'approved', 'dismissed']
  const filtered = applications.filter(a => a.status === activeTab)

  const tabLabel = (tab: ApplicationStatus) => {
    const count = applications.filter(a => a.status === tab).length
    return `${t(`applications.${tab}`)} (${count})`
  }

  return (
    <div className="p-4">
      <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
        {t('applications.title')}
      </h1>

      {/* Tabs — scroll horizontally on tiny screens */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #e5e7eb',
          marginBottom: 16,
          gap: 0,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
      >
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#1d4ed8' : '#6b7280',
              borderBottom: activeTab === tab ? '2px solid #1d4ed8' : '2px solid transparent',
              marginBottom: -2,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Application cards */}
      {filtered.length === 0 ? (
        <p style={{ fontSize: 12, color: '#9ca3af' }}>{t('applications.no_applications')}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const badge = STATUS_BADGE[app.status]
            const submittedDate = new Date(app.submittedAt).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })

            return (
              <div
                key={app.id}
                style={{
                  border: '1px solid #d0d7de',
                  borderRadius: 6,
                  backgroundColor: '#fff',
                  overflow: 'hidden',
                }}
              >
                {/* Card header — wraps on mobile */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                    padding: '10px 14px',
                    backgroundColor: '#f6f8fa',
                    borderBottom: '1px solid #d0d7de',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                      {app.pupilFirstName} {app.pupilSurname}
                    </span>
                    <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 10, display: 'inline-block' }}>
                      {t('applications.dob')}: {app.birthDate}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.text,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 10,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t(`applications.${app.status}`)}
                    </span>
                    {app.status === 'pending' && (
                      <>
                        <button
                          style={{
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            border: '1px solid #86efac',
                            borderRadius: 4,
                            padding: '4px 12px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t('applications.approve')}
                        </button>
                        <button
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            border: '1px solid #fca5a5',
                            borderRadius: 4,
                            padding: '4px 12px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t('applications.dismiss')}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
                    {/* Parents */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                        {t('pupil_detail.parents')}
                      </div>
                      {app.parents.map((parent, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#374151' }}>
                          <span style={{ fontWeight: 500 }}>{parent.name}</span>
                          {' — '}
                          <span style={{ fontFamily: 'monospace' }}>{parent.phone}</span>
                        </div>
                      ))}
                    </div>

                    {/* Document */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                        {t('applications.document')}
                      </div>
                      <div style={{ fontSize: 12, color: app.documentFilename ? '#1d4ed8' : '#9ca3af' }}>
                        {app.documentFilename ?? t('applications.no_document')}
                      </div>
                    </div>

                    {/* Submitted */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                        {t('applications.submitted')}
                      </div>
                      <div style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace' }}>
                        {submittedDate}
                      </div>
                    </div>
                  </div>

                  {/* Custom fields */}
                  {app.customValues.length > 0 && (
                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 4 }}>
                      {app.customValues.map((cv, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 3 }}>
                          <span style={{ fontWeight: 600, color: '#6b7280' }}>{cv.label}: </span>
                          {cv.value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
