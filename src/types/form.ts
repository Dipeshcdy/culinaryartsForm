export type FieldType = 'text' | 'textbox' | 'number' | 'checkbox' | 'select' | 'radio'

export type FormStatus = 'draft' | 'published'

export interface FormFieldOption {
  id: string
  label: string
}

export interface FormField {
  id: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  options?: FormFieldOption[]
  order: number
}

export interface FormDoc {
  id: string
  title: string
  description: string
  status: FormStatus
  fields: FormField[]
  createdAt: Date | null
  updatedAt: Date | null
  createdBy: string
}

export type AnswerValue = string | string[] | boolean

export interface FormSubmission {
  id: string
  answers: Record<string, AnswerValue>
  submittedAt: Date | null
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
  textbox: 'Textbox',
  number: 'Number',
  checkbox: 'Checkbox',
  select: 'Select',
  radio: 'Radio',
}

export const RESERVED_PATHS = new Set(['admin', 'login'])
