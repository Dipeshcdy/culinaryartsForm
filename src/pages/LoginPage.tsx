import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login, user, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/admin')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to sign in. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-aca-cream px-4">
      <div className="w-full max-w-md rounded-xl border border-aca-border bg-white p-8 shadow-sm">
        <div className="mb-8 flex justify-center">
          <BrandLogo className="h-12" />
        </div>
        <h1 className="text-center text-2xl font-semibold text-aca-brown">
          Admin Login
        </h1>
        <p className="mt-2 text-center text-sm text-aca-muted">
          Sign in to manage forms for Academy of Culinary Arts.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-aca-burgundy">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-aca-border px-3 py-2.5 outline-none focus:border-aca-burgundy"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-aca-burgundy">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-aca-border px-3 py-2.5 outline-none focus:border-aca-burgundy"
            />
          </div>
          {error ? <p className="text-sm text-aca-red">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-aca-red py-3 text-sm font-bold tracking-wide text-white uppercase transition hover:bg-aca-burgundy disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
