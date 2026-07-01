import { Link } from 'react-router-dom'
import { supabaseConfigured } from '../lib/supabase'

export function DemoBanner() {
  if (supabaseConfigured) return null

  return (
    <div className="bg-accent/10 border-b border-accent/25 px-4 py-2.5 text-center text-sm text-accent">
      <span className="font-medium">Demo mode</span>
      {' — '}
      browsing works with sample maps. To enable uploads and real downloads, follow{' '}
      <code className="text-text bg-surface2 px-1 rounded">SETUP.txt</code>
      {' '}and add your{' '}
      <code className="text-text bg-surface2 px-1 rounded">.env</code>
      .{' '}
      <Link to="/install" className="underline hover:text-white">
        Install guide
      </Link>
    </div>
  )
}