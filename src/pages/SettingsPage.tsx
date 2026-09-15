import { useState } from 'react'
import {
  updateEmail,
  updatePassword,
} from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'

export function SettingsPage() {
  const { user } = useAuth()

  // Update Email State
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  // Update Password State
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newEmail) return
    setEmailLoading(true)
    setEmailError('')
    setEmailSuccess('')
    try {
      await updateEmail(user, newEmail)
      setEmailSuccess('Email updated successfully.')
      setNewEmail('')
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setEmailError('This action requires a recent login. Please sign out and sign back in to continue.')
      } else {
        setEmailError(err.message || 'Failed to update email.')
      }
    } finally {
      setEmailLoading(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newPassword) return
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')
    try {
      await updatePassword(user, newPassword)
      setPasswordSuccess('Password updated successfully.')
      setNewPassword('')
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setPasswordError('This action requires a recent login. Please sign out and sign back in to continue.')
      } else {
        setPasswordError(err.message || 'Failed to update password.')
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-aca-brown">Settings</h1>
        <p className="mt-2 text-sm text-aca-muted">
          Manage your account settings and add new users.
        </p>
      </div>

      <div className="grid gap-8">
        <section className="rounded-xl border border-aca-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-aca-brown">Change Email</h2>
          {emailError && <p className="mb-4 rounded bg-aca-blush-soft p-3 text-sm text-aca-red">{emailError}</p>}
          {emailSuccess && <p className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">{emailSuccess}</p>}
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-aca-burgundy">New Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full rounded-lg border border-aca-border px-3 py-2 outline-none focus:border-aca-burgundy"
                placeholder="Enter new email"
                required
              />
            </div>
            <button
              type="submit"
              disabled={emailLoading}
              className="rounded-lg bg-aca-burgundy px-4 py-2 text-sm font-bold text-white hover:bg-aca-red disabled:opacity-60"
            >
              {emailLoading ? 'Updating...' : 'Update Email'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-aca-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-aca-brown">Change Password</h2>
          {passwordError && <p className="mb-4 rounded bg-aca-blush-soft p-3 text-sm text-aca-red">{passwordError}</p>}
          {passwordSuccess && <p className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">{passwordSuccess}</p>}
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-aca-burgundy">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-aca-border px-3 py-2 outline-none focus:border-aca-burgundy"
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="rounded-lg bg-aca-burgundy px-4 py-2 text-sm font-bold text-white hover:bg-aca-red disabled:opacity-60"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>

      </div>
    </div>
  )
}
