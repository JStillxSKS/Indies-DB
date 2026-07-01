import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabaseConfigured } from '../lib/supabase'

type Mode = 'signin' | 'signup'

export function Login() {
  const { signInWithPassword, signUpWithPassword, signInWithGoogle, user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!supabaseConfigured) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-muted">
        Configure Supabase in .env to enable login.
      </div>
    )
  }

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const result =
      mode === 'signin'
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password)

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (mode === 'signup') {
      setMessage('Account created. If email confirmation is on, check your inbox — otherwise sign in now.')
      setMode('signin')
      return
    }

    navigate('/')
  }

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    const { error: err } = await signInWithGoogle()
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2 text-center">Indies-DB</h1>
      <p className="text-muted text-sm text-center mb-8">Sign in to upload maps</p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full py-3 rounded-lg border border-border bg-surface hover:border-accent/50 font-medium text-sm mb-6 flex items-center justify-center gap-2"
      >
        <span className="text-lg">G</span> Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted">or email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex gap-2 mb-4">
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null); setMessage(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              mode === m ? 'bg-accent text-white' : 'bg-surface2 text-muted'
            }`}
          >
            {m === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-surface border border-border focus:outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-surface border border-border focus:outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-dl">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold"
        >
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}