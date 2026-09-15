import { useState, useEffect } from 'react'
import {
  verifyBeforeUpdateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function SettingsPage() {
  const { user } = useAuth()

  // General Settings State
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [websiteLoading, setWebsiteLoading] = useState(false)
  const [websiteError, setWebsiteError] = useState('')
  const [websiteSuccess, setWebsiteSuccess] = useState('')

  // Update Email State
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  // Update Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, 'settings', 'general')
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          setWebsiteUrl(snap.data().websiteUrl || '')
        }
      } catch (err) {
        console.error('Failed to load settings', err)
      }
    }
    void loadSettings()
  }, [])

  async function handleUpdateWebsite(e: React.FormEvent) {
    e.preventDefault()
    setWebsiteLoading(true)
    setWebsiteError('')
    setWebsiteSuccess('')
    try {
      await setDoc(doc(db, 'settings', 'general'), { websiteUrl }, { merge: true })
      setWebsiteSuccess('Website URL updated successfully.')
    } catch (err: any) {
      setWebsiteError(err.message || 'Failed to update settings.')
    } finally {
      setWebsiteLoading(false)
    }
  }

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newEmail) return
    setEmailLoading(true)
    setEmailError('')
    setEmailSuccess('')
    try {
      await verifyBeforeUpdateEmail(user, newEmail)
      setEmailSuccess('A verification link has been sent to your new email. Please verify it to complete the change.')
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
    if (!user || !user.email || !newPassword || !currentPassword || !confirmPassword) return
    
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setPasswordLoading(true)
    
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      
      await updatePassword(user, newPassword)
      
      setPasswordSuccess('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password. Please check your current password.')
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
          <h2 className="mb-4 text-xl font-semibold text-aca-brown">General Settings</h2>
          {websiteError && <p className="mb-4 rounded bg-aca-blush-soft p-3 text-sm text-aca-red">{websiteError}</p>}
          {websiteSuccess && <p className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">{websiteSuccess}</p>}
          <form onSubmit={handleUpdateWebsite} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-aca-burgundy">Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full rounded-lg border border-aca-border px-3 py-2 outline-none focus:border-aca-burgundy"
                placeholder="https://example.com"
                required
              />
              <p className="mt-1 text-xs text-aca-muted">This is the link used for the "Visit Website" button on public forms.</p>
            </div>
            <button
              type="submit"
              disabled={websiteLoading}
              className="rounded-lg bg-aca-burgundy px-4 py-2 text-sm font-bold text-white hover:bg-aca-red disabled:opacity-60"
            >
              {websiteLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </section>

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
              <label className="mb-1 block text-sm font-semibold text-aca-burgundy">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-aca-border px-3 py-2 outline-none focus:border-aca-burgundy"
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-aca-burgundy">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-aca-border px-3 py-2 outline-none focus:border-aca-burgundy"
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-aca-burgundy">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-aca-border px-3 py-2 outline-none focus:border-aca-burgundy"
                placeholder="Confirm new password"
                minLength={6}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 rounded border-aca-border text-aca-burgundy focus:ring-aca-burgundy"
              />
              <label htmlFor="showPassword" className="cursor-pointer text-sm font-medium text-aca-brown">
                Show passwords
              </label>
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
