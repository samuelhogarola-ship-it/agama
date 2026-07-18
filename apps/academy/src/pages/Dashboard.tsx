import { Link } from 'react-router-dom'
import { SCHOOLS } from '../data/schools'
import { CATALOG } from '../data/catalog'
import { useAuth } from '../auth/AuthContext'
import { useProgress } from '../data/ProgressContext'
import { schoolStats, overallStats, isSchoolLocked } from '../lib/gating'
import { ProgressBar } from '../components/ProgressBar'
import type { SchoolId } from '../lib/types'

export function Dashboard() {
  const { user } = useAuth()
  const { progress, loading } = useProgress()
  const overall = overallStats(CATALOG, progress)

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-slate-800">
          Hola, {user?.name.split(' ')[0] ?? 'colaborador'} 👋
        </h1>
        <p className="mt-1 text-slate-500">Bienvenido a APEX. Aprende el Estilo AGAMA a través de nuestras escuelas.</p>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Progreso general</span>
            <span className="text-slate-500">
              {loading ? '…' : `${overall.done}/${overall.total} items (${overall.pct}%)`}
            </span>
          </div>
          <ProgressBar pct={loading ? 0 : overall.pct} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Nuestras escuelas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCHOOLS.map((school) => {
            const schoolItems = CATALOG.filter((i) => i.school === school.id)
            const stats = schoolStats(schoolItems, progress)
            const locked = isSchoolLocked(school.id as SchoolId, CATALOG, progress)

            if (locked) {
              return (
                <div
                  key={school.id}
                  className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-5 opacity-60"
                >
                  <span className="text-3xl grayscale">{school.icon}</span>
                  <h3 className="mt-3 font-semibold text-slate-400">{school.name}</h3>
                  <p className="mt-1 flex-1 text-sm text-slate-400">{school.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                    <span>🔒</span>
                    <span>Completa la escuela anterior para desbloquear</span>
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={school.id}
                to={`/escuela/${school.id}`}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
              >
                <span className="text-3xl">{school.icon}</span>
                <h3 className="mt-3 font-semibold text-slate-800">{school.name}</h3>
                <p className="mt-1 flex-1 text-sm text-slate-500">{school.description}</p>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>{schoolItems.length} items</span>
                    <span>{stats.pct}%</span>
                  </div>
                  <ProgressBar pct={stats.pct} />
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
