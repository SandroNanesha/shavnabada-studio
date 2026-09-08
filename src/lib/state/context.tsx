'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { MonthOverrideStatus, PupilParent, Pupil } from '@/types'

export interface PupilBasicEdit {
  firstName: string
  surname: string
  idNumber: string
  birthDate: string
  parents: PupilParent[]
}

interface AppState {
  // enrollmentId → month → status
  monthOverrides: Record<string, Record<string, MonthOverrideStatus>>
  // enrollmentId → month → paid amount
  paidAmountOverrides: Record<string, Record<string, number>>
  // enrollmentId → month → custom due amount
  dueOverrides: Record<string, Record<string, number>>
  // enrollmentId → classificationId | null
  classificationOverrides: Record<string, string | null>
  // enrollmentId → month → comment text
  ledgerComments: Record<string, Record<string, string>>
  // pupilId → basic info overrides
  pupilEdits: Record<string, PupilBasicEdit>
  // pupils list filters
  pupilFilters: {
    search: string
    groupFilter: string
    viewMode: 'active' | 'inactive'
    fromMonth: string
    toMonth: string
    statusFilters: MonthOverrideStatus[]
  }
  // pupilId → archived override
  archivedOverrides: Record<string, boolean>
  // manually added pupils (prepended to mock list)
  addedPupils: Pupil[]
  futureMonths: number
  paymentDueDay: number
  studioName: string
  platformLogo: string
  formLogo: string
}

interface AppStateActions {
  setMonthOverride: (enrollmentId: string, month: string, status: MonthOverrideStatus | null) => void
  setPaidAmountOverride: (enrollmentId: string, month: string, amount: number | null) => void
  setDueOverride: (enrollmentId: string, month: string, amount: number | null) => void
  setClassificationOverride: (enrollmentId: string, classificationId: string | null) => void
  setLedgerComment: (enrollmentId: string, month: string, comment: string) => void
  setPupilEdit: (pupilId: string, data: PupilBasicEdit) => void
  setPupilFilters: (patch: Partial<AppState['pupilFilters']>) => void
  setArchivedOverride: (pupilId: string, archived: boolean) => void
  addPupil: (pupil: Pupil) => void
  setFutureMonths: (n: number) => void
  setPaymentDueDay: (n: number) => void
  setStudioName: (name: string) => void
  setPlatformLogo: (url: string) => void
  setFormLogo: (url: string) => void
}

const AppStateContext = createContext<(AppState & AppStateActions) | null>(null)

function currentSchoolYear(): { fromMonth: string; toMonth: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const currentMonth = `${year}-${String(month).padStart(2, '0')}`
  // School year starts Sep: if we're in Sep or later, current year started this Sep
  const startYear = month >= 9 ? year : year - 1
  return { fromMonth: `${startYear}-09`, toMonth: currentMonth }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [monthOverrides, setMonthOverrides] = useState<AppState['monthOverrides']>({})
  const [paidAmountOverrides, setPaidAmountOverrides] = useState<AppState['paidAmountOverrides']>({})
  const [dueOverrides, setDueOverridesState] = useState<AppState['dueOverrides']>({})
  const [classificationOverrides, setClassificationOverrides] = useState<AppState['classificationOverrides']>({})
  const [ledgerComments, setLedgerComments] = useState<AppState['ledgerComments']>({})
  const [pupilEdits, setPupilEditsState] = useState<AppState['pupilEdits']>({})
  const [archivedOverrides, setArchivedOverridesState] = useState<AppState['archivedOverrides']>({})
  const [addedPupils, setAddedPupils] = useState<Pupil[]>([])
  const [pupilFilters, setPupilFiltersState] = useState<AppState['pupilFilters']>({
    search: '',
    groupFilter: '',
    viewMode: 'active',
    ...currentSchoolYear(),
    statusFilters: [],
  })

  const setMonthOverride = (enrollmentId: string, month: string, status: MonthOverrideStatus | null) => {
    setMonthOverrides(prev => {
      const enrollment = { ...prev[enrollmentId] }
      if (status === null) {
        delete enrollment[month]
      } else {
        enrollment[month] = status
      }
      return { ...prev, [enrollmentId]: enrollment }
    })
  }

  const setPaidAmountOverride = (enrollmentId: string, month: string, amount: number | null) => {
    setPaidAmountOverrides(prev => {
      const enrollment = { ...prev[enrollmentId] }
      if (amount === null) {
        delete enrollment[month]
      } else {
        enrollment[month] = amount
      }
      return { ...prev, [enrollmentId]: enrollment }
    })
  }

  const setDueOverride = (enrollmentId: string, month: string, amount: number | null) => {
    setDueOverridesState(prev => {
      const enrollment = { ...prev[enrollmentId] }
      if (amount === null) {
        delete enrollment[month]
      } else {
        enrollment[month] = amount
      }
      return { ...prev, [enrollmentId]: enrollment }
    })
  }

  const setClassificationOverride = (enrollmentId: string, classificationId: string | null) => {
    setClassificationOverrides(prev => ({ ...prev, [enrollmentId]: classificationId }))
  }

  const setLedgerComment = (enrollmentId: string, month: string, comment: string) => {
    setLedgerComments(prev => ({
      ...prev,
      [enrollmentId]: { ...(prev[enrollmentId] ?? {}), [month]: comment },
    }))
  }

  const setPupilEdit = (pupilId: string, data: PupilBasicEdit) => {
    setPupilEditsState(prev => ({ ...prev, [pupilId]: data }))
  }

  const setPupilFilters = (patch: Partial<AppState['pupilFilters']>) => {
    setPupilFiltersState(prev => ({ ...prev, ...patch }))
  }

  const setArchivedOverride = (pupilId: string, archived: boolean) => {
    setArchivedOverridesState(prev => ({ ...prev, [pupilId]: archived }))
  }

  const addPupil = (pupil: Pupil) => {
    setAddedPupils(prev => [pupil, ...prev])
  }

  const [futureMonths, setFutureMonthsState] = useState(2)
  const setFutureMonths = (n: number) => setFutureMonthsState(n)
  const [paymentDueDay, setPaymentDueDayState] = useState(1)
  const setPaymentDueDay = (n: number) => setPaymentDueDayState(n)
  const [studioName, setStudioNameState] = useState('Shavnabada Studio')
  const setStudioName = (name: string) => setStudioNameState(name)
  const [platformLogo, setPlatformLogoState] = useState('')
  const [formLogo, setFormLogoState] = useState('')
  const setPlatformLogo = (url: string) => setPlatformLogoState(url)
  const setFormLogo = (url: string) => setFormLogoState(url)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then((s: { studioName: string; futureMonths: number; paymentDueDay: number; platformLogo: string; formLogo: string }) => {
      setStudioNameState(s.studioName ?? 'Shavnabada Studio')
      setFutureMonthsState(s.futureMonths ?? 2)
      setPaymentDueDayState(s.paymentDueDay ?? 1)
      setPlatformLogoState(s.platformLogo ?? '')
      setFormLogoState(s.formLogo ?? '')
    }).catch(() => {})
  }, [])

  return (
    <AppStateContext.Provider value={{
      monthOverrides, paidAmountOverrides, dueOverrides, classificationOverrides, ledgerComments, pupilEdits, pupilFilters, archivedOverrides, addedPupils,
      futureMonths, paymentDueDay, studioName, platformLogo, formLogo,
      setMonthOverride, setPaidAmountOverride, setDueOverride, setClassificationOverride, setLedgerComment, setPupilEdit, setPupilFilters, setArchivedOverride, addPupil,
      setFutureMonths, setPaymentDueDay, setStudioName, setPlatformLogo, setFormLogo,
    }}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}
