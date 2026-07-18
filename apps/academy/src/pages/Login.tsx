import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { BRAND } from '../config/brand'
import { useAuth } from '../auth/AuthContext'

export function Login() {
  const { user, signIn, demoMode } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await signIn(email, password)
    if (err) setError(err)
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-4xl">🎓</span>
          <h1 className="mt-2 text-xl font-bold text-slate-800">{BRAND.platformName}</h1>
          <p className="text-sm text-slate-500">{BRAND.tagline}</p>
        </div>
        {demoMode && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Modo demo (sin Supabase): las cuentas se guardan solo en este navegador.
          </p>
        )}
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              placeholder="tu@agama.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          ¿Nuevo en {BRAND.company}?{' '}
          <Link to="/registro" className="font-medium text-blue-600 hover:underline">
            Crea tu cuenta
          </Link>
        </p>
      </div>
    </div>
  )
}
