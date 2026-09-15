import { useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { db, firebaseConfig } from '../lib/firebase'

interface AdminUser {
  id: string
  email: string
  createdAt: string
  createdBy: string
}

export function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [addUserError, setAddUserError] = useState('')

  // Delete User Modal State
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function fetchUsers() {
    try {
      const snap = await getDocs(collection(db, 'admins'))
      const adminsList: AdminUser[] = []
      snap.forEach((doc) => {
        adminsList.push({ id: doc.id, ...doc.data() } as AdminUser)
      })
      setUsers(adminsList)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchUsers()
  }, [])

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    if (!newUserEmail || !newUserPassword) return
    setAddUserLoading(true)
    setAddUserError('')

    try {
      // Use a secondary app to create a user without signing out the current user
      const secondaryApp = initializeApp(firebaseConfig, 'Secondary')
      const secondaryAuth = getAuth(secondaryApp)

      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        newUserEmail,
        newUserPassword,
      )

      const adminData = {
        email: newUserEmail,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || '',
      }

      // Add the new user to the admins collection
      await setDoc(doc(db, 'admins', cred.user.uid), adminData)

      // Sign out from the secondary app to clean up
      await secondaryAuth.signOut()

      setUsers((prev) => [...prev, { id: cred.user.uid, ...adminData }])
      
      setIsAddModalOpen(false)
      setNewUserEmail('')
      setNewUserPassword('')
    } catch (err: any) {
      setAddUserError(err.message || 'Failed to add user.')
    } finally {
      setAddUserLoading(false)
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return
    setDeleteLoading(true)
    setDeleteError('')

    try {
      await deleteDoc(doc(db, 'admins', userToDelete.id))
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      setUserToDelete(null)
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete user.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-aca-brown">Users</h1>
          <p className="mt-2 text-sm text-aca-muted">
            Manage admin users who have access to the dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-lg bg-aca-burgundy px-4 py-2 text-sm font-bold text-white hover:bg-aca-red"
        >
          + Add User
        </button>
      </div>

      {error ? (
        <p className="rounded-lg bg-aca-blush-soft p-4 text-sm text-aca-red">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-aca-muted text-sm">Loading users...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-aca-border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-aca-cream/50 text-xs uppercase text-aca-muted">
              <tr>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Created At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aca-border">
              {users.map((u) => (
                <tr key={u.id} className="transition hover:bg-aca-cream/30">
                  <td className="px-6 py-4 font-medium text-aca-brown">
                    {u.email}
                    {u.id === user?.uid && (
                      <span className="ml-2 rounded bg-aca-blush-soft px-2 py-0.5 text-xs text-aca-burgundy">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-aca-body">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== user?.uid && (
                      <button
                        type="button"
                        onClick={() => setUserToDelete(u)}
                        className="text-aca-red font-semibold hover:text-aca-burgundy"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-aca-muted">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-aca-brown">Add New Admin User</h2>
            {addUserError && (
              <p className="mb-4 rounded bg-aca-blush-soft p-3 text-sm text-aca-red">
                {addUserError}
              </p>
            )}
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-aca-burgundy">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full rounded-lg border border-aca-border px-3 py-2 outline-none focus:border-aca-burgundy"
                  placeholder="User's email"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-aca-burgundy">Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full rounded-lg border border-aca-border px-3 py-2 outline-none focus:border-aca-burgundy"
                  placeholder="Temporary password (min 6 chars)"
                  minLength={6}
                  required
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-aca-brown hover:bg-aca-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="rounded-lg bg-aca-burgundy px-4 py-2 text-sm font-bold text-white hover:bg-aca-red disabled:opacity-60"
                >
                  {addUserLoading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-aca-brown">Revoke Access</h2>
            <p className="mt-2 text-sm text-aca-body">
              Are you sure you want to revoke dashboard access for <strong>{userToDelete.email}</strong>? 
              They will no longer be able to log in.
            </p>
            {deleteError && (
              <p className="mt-4 rounded bg-aca-blush-soft p-3 text-sm text-aca-red">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setUserToDelete(null)
                  setDeleteError('')
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-aca-brown hover:bg-aca-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteUser()}
                disabled={deleteLoading}
                className="rounded-lg bg-aca-red px-4 py-2 text-sm font-bold text-white hover:bg-aca-burgundy disabled:opacity-60"
              >
                {deleteLoading ? 'Revoking...' : 'Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
