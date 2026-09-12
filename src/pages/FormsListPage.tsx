import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteForm, listForms } from '../lib/forms'
import type { FormDoc } from '../types/form'

export function FormsListPage() {
  const [forms, setForms] = useState<FormDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      setForms(await listForms())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function handleCopy(formId: string) {
    const url = `${window.location.origin}/${formId}`
    await navigator.clipboard.writeText(url)
    setCopiedId(formId)
    window.setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleDelete(form: FormDoc) {
    if (!window.confirm(`Delete “${form.title}”? This cannot be undone.`)) return
    await deleteForm(form.id)
    await refresh()
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-aca-brown">Form Creator</h1>
          <p className="mt-2 text-aca-muted">
            Create forms, publish them, and share a unique public link.
          </p>
        </div>
        <Link
          to="/admin/forms/new"
          className="rounded-lg bg-aca-red px-4 py-2.5 text-sm font-bold text-white uppercase hover:bg-aca-burgundy"
        >
          Create form
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-aca-border bg-white">
        {loading ? (
          <p className="p-6 text-aca-muted">Loading…</p>
        ) : forms.length === 0 ? (
          <p className="p-6 text-sm text-aca-muted">No forms yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-aca-blush-soft text-aca-burgundy">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Fields</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aca-border">
                {forms.map((form) => (
                  <tr key={form.id}>
                    <td className="px-4 py-3 font-medium text-aca-brown">{form.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          'rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase',
                          form.status === 'published'
                            ? 'bg-aca-blush text-aca-burgundy'
                            : 'bg-gray-100 text-aca-muted',
                        ].join(' ')}
                      >
                        {form.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{form.fields.length}</td>
                    <td className="px-4 py-3 text-aca-muted">
                      {form.updatedAt
                        ? form.updatedAt.toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        <Link
                          to={`/admin/forms/${form.id}`}
                          className="font-semibold text-aca-burgundy hover:text-aca-red"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/admin/forms/${form.id}/submissions`}
                          className="font-semibold text-aca-burgundy hover:text-aca-red"
                        >
                          Submissions
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleCopy(form.id)}
                          className="font-semibold text-aca-burgundy hover:text-aca-red"
                        >
                          {copiedId === form.id ? 'Copied!' : 'Copy link'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(form)}
                          className="font-semibold text-aca-red hover:text-aca-burgundy"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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
