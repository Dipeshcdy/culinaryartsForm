import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listForms } from '../lib/forms'
import { listSubmissions } from '../lib/submissions'
import type { FormDoc } from '../types/form'

export function AdminDashboard() {
  const [forms, setForms] = useState<FormDoc[]>([])
  const [submissionCount, setSubmissionCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await listForms()
        if (cancelled) return
        setForms(data)
        const counts = await Promise.all(
          data.map(async (f) => (await listSubmissions(f.id)).length),
        )
        if (!cancelled) {
          setSubmissionCount(counts.reduce((a, b) => a + b, 0))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const published = forms.filter((f) => f.status === 'published').length

  return (
    <div>
      <h1 className="text-3xl font-semibold text-aca-brown">Dashboard</h1>
      <p className="mt-2 text-aca-muted">
        Manage enquiry and admissions forms for ACA.
      </p>

      {loading ? (
        <p className="mt-8 text-aca-muted">Loading…</p>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Total forms" value={forms.length} />
            <Stat label="Published" value={published} />
            <Stat label="Submissions" value={submissionCount} />
          </div>

          <div className="mt-10 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-aca-brown">Recent forms</h2>
            <Link
              to="/admin/forms/new"
              className="rounded-lg bg-aca-red px-4 py-2 text-sm font-bold text-white uppercase hover:bg-aca-burgundy"
            >
              New form
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-aca-border bg-white">
            {forms.length === 0 ? (
              <p className="p-6 text-sm text-aca-muted">
                No forms yet. Create your first form in Form Creator.
              </p>
            ) : (
              <ul className="divide-y divide-aca-border">
                {forms.slice(0, 5).map((form) => (
                  <li key={form.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="font-semibold text-aca-brown">{form.title}</p>
                      <p className="text-xs text-aca-muted">
                        {form.status} · {form.fields.length} fields
                      </p>
                    </div>
                    <Link
                      to={`/admin/forms/${form.id}`}
                      className="text-sm font-semibold text-aca-burgundy hover:text-aca-red"
                    >
                      Edit
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-aca-border bg-white p-5">
      <p className="text-sm text-aca-muted">{label}</p>
      <p className="mt-2 font-heading text-3xl font-semibold text-aca-brown">{value}</p>
    </div>
  )
}
