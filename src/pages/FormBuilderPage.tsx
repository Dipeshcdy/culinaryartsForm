import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FormPreview } from '../components/FormPreview'
import { useAuth } from '../contexts/AuthContext'
import { createForm, getForm, updateForm } from '../lib/forms'
import {
  FIELD_TYPE_LABELS,
  type FieldType,
  type FormField,
  type FormFieldOption,
  type FormStatus,
} from '../types/form'

function newId() {
  return crypto.randomUUID()
}

function createEmptyField(order: number): FormField {
  return {
    id: newId(),
    label: '',
    type: 'text',
    required: true,
    placeholder: '',
    options: [],
    order,
  }
}

function needsOptions(type: FieldType) {
  return type === 'select' || type === 'radio' || type === 'checkbox'
}

export function FormBuilderPage() {
  const { formId } = useParams()
  const isNew = !formId || formId === 'new'
  const navigate = useNavigate()
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<FormStatus>('draft')
  const [fields, setFields] = useState<FormField[]>([createEmptyField(0)])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : formId!)

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    async function load() {
      try {
        const form = await getForm(formId!)
        if (!form || cancelled) {
          if (!cancelled) setError('Form not found.')
          return
        }
        setTitle(form.title)
        setDescription(form.description)
        setStatus(form.status)
        setFields(
          form.fields.length > 0
            ? [...form.fields].sort((a, b) => a.order - b.order)
            : [createEmptyField(0)],
        )
        setSavedId(form.id)
      } catch {
        if (!cancelled) setError('Failed to load form.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [formId, isNew])

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f
        const next = { ...f, ...patch }
        if (patch.type && needsOptions(patch.type) && (!next.options || next.options.length === 0)) {
          next.options = [
            { id: newId(), label: 'Option 1' },
            { id: newId(), label: 'Option 2' },
          ]
        }
        return next
      }),
    )
  }

  function addField() {
    setFields((prev) => [...prev, createEmptyField(prev.length)])
  }

  function removeField(id: string) {
    setFields((prev) =>
      prev
        .filter((f) => f.id !== id)
        .map((f, index) => ({ ...f, order: index })),
    )
  }

  function moveField(id: string, direction: -1 | 1) {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next.map((f, i) => ({ ...f, order: i }))
    })
  }

  function updateOption(fieldId: string, optionId: string, label: string) {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f
        return {
          ...f,
          options: (f.options ?? []).map((o) =>
            o.id === optionId ? { ...o, label } : o,
          ),
        }
      }),
    )
  }

  function addOption(fieldId: string) {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f
        const options = f.options ?? []
        return {
          ...f,
          options: [
            ...options,
            { id: newId(), label: `Option ${options.length + 1}` },
          ],
        }
      }),
    )
  }

  function removeOption(fieldId: string, optionId: string) {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f
        return {
          ...f,
          options: (f.options ?? []).filter((o) => o.id !== optionId),
        }
      }),
    )
  }

  function validate(): string | null {
    if (!title.trim()) return 'Form title is required.'
    if (fields.length === 0) return 'Add at least one field.'
    for (const field of fields) {
      if (!field.label.trim()) return 'Every field needs a label.'
      if (needsOptions(field.type)) {
        const opts = (field.options ?? []).filter((o) => o.label.trim())
        if (opts.length === 0) {
          return `“${field.label || 'A field'}” needs at least one option.`
        }
      }
    }
    return null
  }

  async function save(nextStatus: FormStatus) {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    if (!user) return

    setSaving(true)
    setError('')
    const payload = {
      title: title.trim(),
      description: description.trim(),
      status: nextStatus,
      fields: fields.map((f, index) => ({
        ...f,
        label: f.label.trim(),
        placeholder: f.placeholder?.trim() || '',
        order: index,
        options: needsOptions(f.type)
          ? (f.options ?? [])
              .filter((o) => o.label.trim())
              .map((o) => ({ ...o, label: o.label.trim() }))
          : [],
      })),
    }

    try {
      if (savedId) {
        await updateForm(savedId, payload)
        setStatus(nextStatus)
      } else {
        const id = await createForm({ ...payload, createdBy: user.uid })
        setSavedId(id)
        setStatus(nextStatus)
        navigate(`/admin/forms/${id}`, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save form.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCopyLink() {
    if (!savedId) return
    await navigator.clipboard.writeText(`${window.location.origin}/${savedId}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <p className="text-aca-muted">Loading form…</p>
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/forms" className="text-sm font-semibold text-aca-burgundy">
            ← Back to forms
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-aca-brown">
            {isNew && !savedId ? 'Create form' : 'Edit form'}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {savedId ? (
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="rounded-lg border border-aca-burgundy px-4 py-2 text-sm font-semibold text-aca-burgundy"
            >
              {copied ? 'Copied!' : 'Copy public link'}
            </button>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void save('draft')}
            className="rounded-lg border border-aca-border bg-white px-4 py-2 text-sm font-semibold text-aca-brown disabled:opacity-60"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save('published')}
            className="rounded-lg bg-aca-red px-4 py-2 text-sm font-bold text-white uppercase hover:bg-aca-burgundy disabled:opacity-60"
          >
            Publish
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg bg-aca-blush-soft px-4 py-3 text-sm text-aca-red">
          {error}
        </p>
      ) : null}

      <p className="mb-6 text-sm text-aca-muted">
        Status:{' '}
        <span className="font-semibold uppercase text-aca-burgundy">{status}</span>
        {savedId ? (
          <>
            {' '}
            · Public URL:{' '}
            <code className="rounded bg-white px-1.5 py-0.5 text-aca-brown">
              /{savedId}
            </code>
          </>
        ) : null}
      </p>

      <div className="grid gap-8 xl:grid-cols-2">
        <form
          className="space-y-6 rounded-xl border border-aca-border bg-white p-6"
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            void save(status)
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-aca-burgundy">
              Form title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-aca-border px-3 py-2.5 outline-none focus:border-aca-burgundy"
              placeholder="e.g. Programme Enquiry"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-aca-burgundy">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20 w-full rounded-lg border border-aca-border px-3 py-2.5 outline-none focus:border-aca-burgundy"
              placeholder="Optional short intro shown above the form"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-aca-brown">Fields</h2>
              <button
                type="button"
                onClick={addField}
                className="text-sm font-semibold text-aca-burgundy hover:text-aca-red"
              >
                + Add field
              </button>
            </div>

            {fields.map((field, index) => (
              <FieldEditor
                key={field.id}
                field={field}
                index={index}
                total={fields.length}
                onChange={(patch) => updateField(field.id, patch)}
                onRemove={() => removeField(field.id)}
                onMoveUp={() => moveField(field.id, -1)}
                onMoveDown={() => moveField(field.id, 1)}
                onAddOption={() => addOption(field.id)}
                onUpdateOption={(optionId, label) =>
                  updateOption(field.id, optionId, label)
                }
                onRemoveOption={(optionId) => removeOption(field.id, optionId)}
              />
            ))}
          </div>
        </form>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-aca-brown">Live preview</h2>
          <FormPreview title={title} description={description} fields={fields} />
        </div>
      </div>
    </div>
  )
}

interface FieldEditorProps {
  field: FormField
  index: number
  total: number
  onChange: (patch: Partial<FormField>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAddOption: () => void
  onUpdateOption: (optionId: string, label: string) => void
  onRemoveOption: (optionId: string) => void
}

function FieldEditor({
  field,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: FieldEditorProps) {
  return (
    <div className="rounded-lg border border-aca-border bg-aca-cream/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-aca-burgundy">Field {index + 1}</p>
        <div className="flex gap-2 text-xs font-semibold">
          <button type="button" onClick={onMoveUp} disabled={index === 0} className="text-aca-muted disabled:opacity-40">
            Up
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="text-aca-muted disabled:opacity-40"
          >
            Down
          </button>
          <button type="button" onClick={onRemove} className="text-aca-red">
            Remove
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-aca-muted">Label</label>
          <input
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="w-full rounded-lg border border-aca-border bg-white px-3 py-2 outline-none focus:border-aca-burgundy"
            placeholder="Field label"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-aca-muted">Type</label>
          <select
            value={field.type}
            onChange={(e) => onChange({ type: e.target.value as FieldType })}
            className="w-full rounded-lg border border-aca-border bg-white px-3 py-2 outline-none focus:border-aca-burgundy"
          >
            {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((type) => (
              <option key={type} value={type}>
                {FIELD_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-2 text-sm text-aca-body">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onChange({ required: e.target.checked })}
              className="accent-aca-burgundy"
            />
            Required
          </label>
        </div>
        {(field.type === 'text' || field.type === 'textbox' || field.type === 'number' || field.type === 'select') && (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-aca-muted">
              Placeholder
            </label>
            <input
              value={field.placeholder ?? ''}
              onChange={(e) => onChange({ placeholder: e.target.value })}
              className="w-full rounded-lg border border-aca-border bg-white px-3 py-2 outline-none focus:border-aca-burgundy"
            />
          </div>
        )}
      </div>

      {needsOptions(field.type) ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-aca-muted">
              Options
            </p>
            <button
              type="button"
              onClick={onAddOption}
              className="text-xs font-semibold text-aca-burgundy"
            >
              + Add option
            </button>
          </div>
          {(field.options ?? []).map((opt: FormFieldOption) => (
            <div key={opt.id} className="flex gap-2">
              <input
                value={opt.label}
                onChange={(e) => onUpdateOption(opt.id, e.target.value)}
                className="flex-1 rounded-lg border border-aca-border bg-white px-3 py-2 outline-none focus:border-aca-burgundy"
              />
              <button
                type="button"
                onClick={() => onRemoveOption(opt.id)}
                className="px-2 text-sm text-aca-red"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
