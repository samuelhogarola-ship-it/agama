import { Link, Navigate, useParams } from 'react-router-dom'
import { findSchool } from '../data/schools'
import { CATALOG } from '../data/catalog'
import { useProgress } from '../data/ProgressContext'
import { isItemCompleted, schoolStats } from '../lib/gating'
import { ProgressBar } from '../components/ProgressBar'

const TYPE_ICON: Record<string, string> = {
  capitulo: '📖',
  guia: '📋',
  evaluacion: '✅',
}

export function SchoolPage() {
  const { schoolId } = useParams()
  const { progress } = useProgress()
  const school = findSchool(schoolId)
  if (!school) return <Navigate to="/" replace />

  const items = school ? CATALOG.filter((i) => i.school === school.id) : []
  const stats = schoolStats(items, progress)

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← Volver al panel
        </Link>
        <div className="mt-3 flex items-start gap-4">
          <span className="text-4xl">{school.icon}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">{school.name}</h1>
            <p className="mt-1 text-slate-500">{school.description}</p>
            <div className="mt-3 max-w-sm">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>
                  {stats.done}/{stats.total} completados
                </span>
                <span>{stats.pct}%</span>
              </div>
              <ProgressBar pct={stats.pct} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const completed = isItemCompleted(item.slug, progress)
          const badge = TYPE_ICON[item.type] || '📄'
          return (
            <Link
              key={item.slug}
              to={`/item/${item.slug}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
            >
              <span className="text-lg">{completed ? '✓' : badge}</span>
              <div className="flex-1">
                <p className={completed ? 'text-sm text-slate-500 line-through' : 'text-sm font-medium text-slate-800'}>
                  {item.title}
                </p>
                <p className="text-xs text-slate-400">
                  {item.code ?? 'Sin código'} • {item.durationMin} min
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
