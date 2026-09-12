import type { AnswerValue, FormField } from '../types/form'

interface FormFieldRendererProps {
  field: FormField
  index: number
  value: AnswerValue | undefined
  error?: string
  onChange: (value: AnswerValue) => void
  disabled?: boolean
}

export function FormFieldRenderer({
  field,
  index,
  value,
  error,
  onChange,
  disabled = false,
}: FormFieldRendererProps) {
  const label = (
    <label className="mb-2 block text-sm font-bold text-aca-burgundy">
      {index + 1}. {field.label}
      {field.required ? <span className="ml-1 text-aca-red">*</span> : null}
    </label>
  )

  const inputClass =
    'w-full rounded-lg border border-aca-border bg-white px-3 py-2.5 text-aca-body outline-none transition focus:border-aca-burgundy'

  if (field.type === 'text') {
    return (
      <div>
        {label}
        <input
          type="text"
          className={inputClass}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {error ? <p className="mt-1 text-sm text-aca-red">{error}</p> : null}
      </div>
    )
  }

  if (field.type === 'textbox') {
    return (
      <div>
        {label}
        <textarea
          className={`${inputClass} min-h-28 resize-y`}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {error ? <p className="mt-1 text-sm text-aca-red">{error}</p> : null}
      </div>
    )
  }

  if (field.type === 'select') {
    return (
      <div>
        {label}
        <select
          className={inputClass}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">
            {field.placeholder || `Select ${field.label.toLowerCase()}`}
          </option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.id} value={opt.label}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? <p className="mt-1 text-sm text-aca-red">{error}</p> : null}
      </div>
    )
  }

  if (field.type === 'radio') {
    const selected = typeof value === 'string' ? value : ''
    return (
      <div>
        {label}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(field.options ?? []).map((opt) => {
            const active = selected === opt.label
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(opt.label)}
                className={[
                  'flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition',
                  active
                    ? 'border-aca-burgundy bg-aca-blush-soft'
                    : 'border-aca-border bg-white hover:border-aca-rose',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    active ? 'border-aca-burgundy' : 'border-aca-rose',
                  ].join(' ')}
                >
                  {active ? (
                    <span className="h-2 w-2 rounded-full bg-aca-burgundy" />
                  ) : null}
                </span>
                <span className="text-sm font-medium text-aca-brown">{opt.label}</span>
              </button>
            )
          })}
        </div>
        {error ? <p className="mt-1 text-sm text-aca-red">{error}</p> : null}
      </div>
    )
  }

  // checkbox — multi-select of options, or single boolean if no options
  const options = field.options ?? []
  if (options.length === 0) {
    const checked = value === true
    return (
      <div>
        {label}
        <label className="flex items-center gap-3 rounded-lg border border-aca-border bg-white px-3 py-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 accent-aca-burgundy"
          />
          <span className="text-sm text-aca-body">Yes</span>
        </label>
        {error ? <p className="mt-1 text-sm text-aca-red">{error}</p> : null}
      </div>
    )
  }

  const selectedList = Array.isArray(value) ? value : []
  return (
    <div>
      {label}
      <div className="space-y-2">
        {options.map((opt) => {
          const checked = selectedList.includes(opt.label)
          return (
            <label
              key={opt.id}
              className="flex items-center gap-3 rounded-lg border border-aca-border bg-white px-3 py-3"
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedList, opt.label])
                  } else {
                    onChange(selectedList.filter((v) => v !== opt.label))
                  }
                }}
                className="h-4 w-4 accent-aca-burgundy"
              />
              <span className="text-sm text-aca-body">{opt.label}</span>
            </label>
          )
        })}
      </div>
      {error ? <p className="mt-1 text-sm text-aca-red">{error}</p> : null}
    </div>
  )
}
