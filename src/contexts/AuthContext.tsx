import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function checkIsAdmin(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'admins', uid))
  return snap.exists()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (next) => {
      if (!next) {
        setUser(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        const admin = await checkIsAdmin(next.uid)
        if (!admin) {
          await signOut(auth)
          setUser(null)
          setIsAdmin(false)
        } else {
          setUser(next)
          setIsAdmin(true)
        }
      } catch {
        setUser(null)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    })

    return () => unsub()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const admin = await checkIsAdmin(cred.user.uid)
    if (!admin) {
      await signOut(auth)
      throw new Error('You are not authorized as an admin.')
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({ user, isAdmin, loading, login, logout }),
    [user, isAdmin, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
