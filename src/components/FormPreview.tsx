import type { AnswerValue, FormField } from '../types/form'
import { FormFieldRenderer } from './FormFieldRenderer'

interface FormPreviewProps {
  title: string
  description: string
  fields: FormField[]
}

export function FormPreview({ title, description, fields }: FormPreviewProps) {
  const sorted = [...fields].sort((a, b) => a.order - b.order)

  return (
    <div className="rounded-xl border border-aca-border bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-aca-brown">
        {title || 'Untitled form'}
      </h3>
      {description ? (
        <p className="mt-1 text-sm text-aca-muted">{description}</p>
      ) : null}
      <div className="mt-6 space-y-5">
        {sorted.length === 0 ? (
          <p className="text-sm text-aca-muted">Add fields to see a preview.</p>
        ) : (
          sorted.map((field, index) => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              index={index}
              value={emptyValue(field)}
              onChange={() => undefined}
              disabled
            />
          ))
        )}
      </div>
      <button
        type="button"
        disabled
        className="mt-8 w-full rounded-lg bg-aca-red py-3 text-sm font-bold tracking-wide text-white uppercase opacity-80"
      >
        Submit
      </button>
    </div>
  )
}

function emptyValue(field: FormField): AnswerValue {
  if (field.type === 'checkbox') {
    return (field.options?.length ?? 0) > 0 ? [] : false
  }
  return ''
}
