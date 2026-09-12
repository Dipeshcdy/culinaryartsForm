import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BrandLogo } from './BrandLogo'
import { useAuth } from '../contexts/AuthContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-aca-burgundy text-white'
      : 'text-aca-brown hover:bg-aca-blush-soft',
  ].join(' ')

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-aca-cream lg:flex">
      <aside className="border-b border-aca-border bg-white lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 border-b border-aca-border px-5 py-4">
          <BrandLogo className="h-9" />
        </div>
        <nav className="space-y-1 p-4">
          <NavLink to="/admin" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/forms" className={linkClass}>
            Form Creator
          </NavLink>
        </nav>
        <div className="border-t border-aca-border p-4">
          <p className="truncate text-xs text-aca-muted">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 text-sm font-semibold text-aca-burgundy hover:text-aca-red"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  )
}
