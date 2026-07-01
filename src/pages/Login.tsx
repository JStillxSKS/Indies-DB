import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabaseConfigured } from '../lib/supabase'

export function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!supabaseConfigured) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-muted">
        Configure Supabase in .env to enable login.
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await signIn(email)
    setLoading(false)
    if (err) setError(err)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold mb-4">Check your email</h1>
        <p className="text-muted">We sent a magic link to <strong className="text-text">{email}</strong></p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="text-2xl font-bold mb-2 text-center">Login</h1>
      <p className="text-muted text-sm text-center mb-8">Magic link — no password needed</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-surface border border-border focus:outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold"
        >
          {loading ? 'Sending…' : 'Send magic link'}
        </button>
      </form>
    </div>
  )
}