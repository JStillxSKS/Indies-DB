import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthResult = { error: string | null }

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>
  signUpWithPassword: (email: string, password: string) => Promise<AuthResult>
  signInWithGoogle: () => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const redirectTo = () => `${window.location.origin}/`

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    async function initAuth() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        await supabase!.auth.exchangeCodeForSession(code)
        window.history.replaceState({}, '', window.location.pathname)
      }

      const { data } = await supabase!.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }

    initAuth()

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUpWithPassword(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured' }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo() },
    })
    return { error: error?.message ?? null }
  }

  async function signInWithGoogle(): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() },
    })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signInWithPassword,
        signUpWithPassword,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}