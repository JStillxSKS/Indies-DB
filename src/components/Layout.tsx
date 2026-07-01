import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabaseConfigured } from '../lib/supabase'
import { DemoBanner } from './DemoBanner'

export function Layout() {
  const { user, signOut } = useAuth()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-surface2 text-text' : 'text-muted hover:text-text hover:bg-surface2/60'
    }`

  return (
    <div className="min-h-svh flex flex-col bg-bg text-text">
      <header className="border-b border-border bg-black/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="font-bold text-lg tracking-tight shrink-0 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center text-sm shadow-none">
              ♪
            </span>
            <span className="text-gradient-smash">Indies-DB</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/maps" className={navClass}>Maps</NavLink>
            {user && supabaseConfigured && (
              <NavLink to="/my-maps" className={navClass}>My Maps</NavLink>
            )}
            <NavLink to="/install" className={navClass}>Install</NavLink>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {!supabaseConfigured ? (
              <span className="text-xs text-accent hidden sm:inline border border-accent/30 rounded px-2 py-0.5">
                Demo mode — add .env to go live
              </span>
            ) : user ? (
              <>
                <NavLink
                  to="/upload"
                  className="px-3 py-1.5 rounded-lg btn-primary text-sm"
                >
                  Upload
                </NavLink>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-sm text-muted hover:text-text px-2"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/upload"
                  className="px-3 py-1.5 rounded-lg btn-primary text-sm"
                >
                  Upload
                </NavLink>
                <NavLink to="/login" className="text-sm text-muted hover:text-text px-2">
                  Login
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      <DemoBanner />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted">
        Indies-DB — community maps for Smash Drums
      </footer>
    </div>
  )
}