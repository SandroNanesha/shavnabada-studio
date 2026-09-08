export type PaymentClassificationType = 'standard' | 'percent' | 'amount' | 'fixed'
export type PupilCategory = 'standard' | 'staff' | 'social' | 'flagged'
export type PupilSource = 'manual' | 'application'
export type MonthOverrideStatus = 'paid' | 'unpaid' | 'partial' | 'confusion' | 'exempt'
export type ApplicationStatus = 'pending' | 'approved' | 'dismissed'
export type TeacherRole = 'Principal' | 'Assistant'
export type PupilOverallStatus = 'paid' | 'partial' | 'watch' | 'risk' | 'exempt'

export interface Location { id: string; name: string }
export interface Group { id: string; name: string; locationId: string }
export interface Teacher { id: string; name: string; contact: string; role: TeacherRole; groupIds: string[] }
export interface Tag { id: string; label: string }
export interface PaymentClassification { id: string; name: string; type: PaymentClassificationType; value: number }

export interface PupilParent { name: string; phone: string }
export interface PupilNote { id: string; date: string; text: string }

export interface EnrollmentGroupHistory { fromGroupId: string; toGroupId: string; date: string }
export interface EnrollmentClassificationHistory { date: string; fromLabel: string; toLabel: string }

export interface Enrollment {
  id: string
  groupId: string
  groupHistory: EnrollmentGroupHistory[]
  startDate: string // YYYY-MM-DD
  endDate: string | null
  baseFee: number
  discount: number
  classificationId: string | null
  classificationHistory: EnrollmentClassificationHistory[]
  customTerms: string
  billingActive: boolean
  prorateFirstMonth: boolean
  monthOverrides: Record<string, MonthOverrideStatus> // YYYY-MM -> status
  monthPaidAmountOverrides?: Record<string, number>   // YYYY-MM -> paid amount
  monthDueOverrides?: Record<string, number>          // YYYY-MM -> custom due amount
  ledgerComments?: Record<string, string>             // YYYY-MM -> comment text
}

export interface Pupil {
  id: string
  firstName: string
  surname: string
  idNumber: string
  birthDate: string
  parents: PupilParent[]
  category: PupilCategory
  condition: string
  archived: boolean
  source: PupilSource
  tagIds: string[]
  notes: PupilNote[]
  enrollments: Enrollment[]
}

export interface Payment {
  id: string
  pupilId: string
  enrollmentId: string
  amount: number
  date: string // YYYY-MM-DD
}

export interface ApplicationCustomField { id: string; label: string; required: boolean }
export interface ApplicationFormConfig { requireDocument: boolean; maxParents: number; customFields: ApplicationCustomField[] }

export type FormFieldType = 'text' | 'phone' | 'date' | 'textarea'

export interface ApplicationFormField {
  id: string
  label: string
  type: FormFieldType
  required: boolean
}

export interface ApplicationForm {
  id: string
  title: string
  slug: string
  fields: ApplicationFormField[]
  active: boolean
  createdAt: string
}

export interface Application {
  id: string
  pupilFirstName: string
  pupilSurname: string
  birthDate: string
  idNumber: string
  parents: PupilParent[]
  documentFilename: string | null
  customValues: { label: string; value: string }[]
  status: ApplicationStatus
  submittedAt: string
  formId?: string | null
}

export interface AppSettings {
  futureMonths: number
  platformLogo: string
  formLogo: string
}

// Computed
export interface LedgerMonth {
  month: string // YYYY-MM
  due: number
  paid: number
  status: MonthOverrideStatus
  isOverride: boolean
}
