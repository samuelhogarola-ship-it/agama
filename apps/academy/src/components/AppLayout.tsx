import { Link, Navigate, Outlet } from 'react-router-dom'
import { BRAND } from '../config/brand'
import { useAuth } from '../auth/AuthContext'
import { ProgressProvider } from '../data/ProgressContext'
import { AssistantWidget } from './AssistantWidget'

export function AppLayout() {
  const { user, loading, demoMode, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-400">Cargando…</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />

  return (
    <ProgressProvider>
      <div className="min-h-screen bg-slate-50">
        {demoMode && (
          <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-800">
            Modo demo: Supabase no está configurado. El registro y el progreso se guardan solo en este
            navegador.
          </div>
        )}
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl">🎓</span>
              <span className="font-semibold text-slate-800">{BRAND.platformName}</span>
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <span className="hidden text-slate-500 sm:inline">{user.name}</span>
              <button
                onClick={() => void signOut()}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:bg-slate-100"
              >
                Salir
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <Outlet />
        </main>
        <AssistantWidget />
      </div>
    </ProgressProvider>
  )
}
