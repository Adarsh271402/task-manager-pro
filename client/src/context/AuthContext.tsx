import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, TOKEN_KEY, USER_KEY } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    // hydrate instantly from cache, then verify against the API
    try {
      const cached = localStorage.getItem(USER_KEY)
      if (cached) setUser(JSON.parse(cached) as User)
    } catch {
      /* ignore malformed cache */
    }
    api
      .get<User>('/auth/me')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem(USER_KEY, JSON.stringify(res.data))
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const persist = (token: string, u: User) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
    persist(res.data.token, res.data.user)
  }, [])

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', { fullName, email, password })
    persist(res.data.token, res.data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const res = await api.get<User>('/auth/me')
    setUser(res.data)
    localStorage.setItem(USER_KEY, JSON.stringify(res.data))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
