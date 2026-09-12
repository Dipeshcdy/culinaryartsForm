import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getForm } from '../lib/forms'
import { listSubmissions } from '../lib/submissions'
import type { AnswerValue, FormDoc, FormSubmission } from '../types/form'

export function SubmissionsPage() {
  const { formId = '' } = useParams()
  const [form, setForm] = useState<FormDoc | null>(null)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [formDoc, rows] = await Promise.all([
          getForm(formId),
          listSubmissions(formId),
        ])
        if (cancelled) return
        if (!formDoc) {
          setError('Form not found.')
          return
        }
        setForm(formDoc)
        setSubmissions(rows)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load submissions.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [formId])

  const columns = useMemo(() => {
    if (!form) return []
    return [...form.fields].sort((a, b) => a.order - b.order)
  }, [form])

  if (loading) return <p className="text-aca-muted">Loading submissions…</p>
  if (error) return <p className="text-aca-red">{error}</p>
  if (!form) return null

  return (
    <div>
      <Link to="/admin/forms" className="text-sm font-semibold text-aca-burgundy">
        ← Back to forms
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-aca-brown">Submissions</h1>
          <p className="mt-1 text-aca-muted">{form.title}</p>
        </div>
        <Link
          to={`/admin/forms/${form.id}`}
          className="text-sm font-semibold text-aca-burgundy hover:text-aca-red"
        >
          Edit form
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-aca-border bg-white">
        {submissions.length === 0 ? (
          <p className="p-6 text-sm text-aca-muted">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-aca-blush-soft text-aca-burgundy">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Submitted</th>
                  {columns.map((col) => (
                    <th key={col.id} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-aca-border">
                {submissions.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-aca-muted">
                      {row.submittedAt ? row.submittedAt.toLocaleString() : '—'}
                    </td>
                    {columns.map((col) => (
                      <td key={col.id} className="max-w-xs px-4 py-3 align-top text-aca-body">
                        {formatAnswer(row.answers[col.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function formatAnswer(value: AnswerValue | undefined): string {
  if (value === undefined || value === null) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  return value || '—'
}
