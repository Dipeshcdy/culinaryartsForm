import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { FormFieldRenderer } from '../components/FormFieldRenderer'
import { getPublishedForm } from '../lib/forms'
import { createSubmission } from '../lib/submissions'
import { RESERVED_PATHS, type AnswerValue, type FormDoc, type FormField } from '../types/form'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function PublicFormPage() {
  const { formId = '' } = useParams()
  const [form, setForm] = useState<FormDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!formId || RESERVED_PATHS.has(formId)) {
      setNotFound(true)
      setLoading(false)
      return
    }

    let cancelled = false
    async function load() {
      try {
        const data = await getPublishedForm(formId)
        if (cancelled) return
        if (!data) {
          setNotFound(true)
          return
        }
        setForm(data)
        const initial: Record<string, AnswerValue> = {}
        for (const field of data.fields) {
          initial[field.id] = defaultAnswer(field)
        }
        setAnswers(initial)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [formId])

  const sortedFields = useMemo(
    () => (form ? [...form.fields].sort((a, b) => a.order - b.order) : []),
    [form],
  )

  function validate(): boolean {
    if (!form) return false
    const next: Record<string, string> = {}
    for (const field of sortedFields) {
      if (!field.required) continue
      const value = answers[field.id]
      if (field.type === 'checkbox') {
        if (Array.isArray(value) ? value.length === 0 : value !== true) {
          next[field.id] = 'This field is required.'
        }
      } else if (typeof value !== 'string' || !value.trim()) {
        next[field.id] = 'This field is required.'
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form || !validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await createSubmission(form.id, answers)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Could not submit. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Shell>
        <p className="text-center text-aca-muted">Loading form…</p>
      </Shell>
    )
  }

  if (notFound || !form) {
    return (
      <Shell>
        <div className="rounded-xl border border-aca-border bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-aca-brown">Form not found</h1>
          <p className="mt-2 text-aca-muted">
            This form does not exist or is not published yet.
          </p>
          <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-aca-burgundy">
            Admin login
          </Link>
        </div>
      </Shell>
    )
  }

  if (submitted) {
    return (
      <Shell>
        <div className="rounded-xl border border-aca-border bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-aca-brown">Thank you</h1>
          <p className="mt-2 text-aca-muted">
            Your response for “{form.title}” has been submitted successfully.
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-aca-border bg-white p-6 shadow-sm sm:p-8"
      >
        <h1 className="text-2xl font-semibold text-aca-brown sm:text-3xl">{form.title}</h1>
        {form.description ? (
          <p className="mt-2 text-aca-muted">{form.description}</p>
        ) : null}

        <div className="mt-8 space-y-6">
          {sortedFields.map((field, index) => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              index={index}
              value={answers[field.id]}
              error={errors[field.id]}
              onChange={(value) => {
                setAnswers((prev) => ({ ...prev, [field.id]: value }))
                setErrors((prev) => {
                  const next = { ...prev }
                  delete next[field.id]
                  return next
                })
              }}
            />
          ))}
        </div>

        {submitError ? <p className="mt-4 text-sm text-aca-red">{submitError}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-8 w-full rounded-lg bg-aca-red py-3.5 text-sm font-bold tracking-wide text-white uppercase transition hover:bg-aca-burgundy disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  const [websiteUrl, setWebsiteUrl] = useState('https://culinaryarts.com.np/')

  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'general'))
        if (snap.exists() && snap.data().websiteUrl) {
          setWebsiteUrl(snap.data().websiteUrl)
        }
      } catch (err) {
        console.error('Failed to load settings', err)
      }
    }
    void loadSettings()
  }, [])

  return (
    <div className="min-h-screen bg-aca-cream">
      <header className="border-b border-aca-border bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <BrandLogo className="h-10" />
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-aca-burgundy px-4 py-2 text-sm font-bold text-white transition hover:bg-aca-red"
          >
            Visit Website
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">{children}</main>
    </div>
  )
}

function defaultAnswer(field: FormField): AnswerValue {
  if (field.type === 'checkbox') {
    return (field.options?.length ?? 0) > 0 ? [] : false
  }
  return ''
}
