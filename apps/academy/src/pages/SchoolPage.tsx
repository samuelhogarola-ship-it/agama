import { Link, Navigate, useParams } from 'react-router-dom'
import { findSchool } from '../data/schools'
import { CATALOG } from '../data/catalog'
import { useProgress } from '../data/ProgressContext'
import { isItemCompleted, isItemLocked, orderedCatalog, schoolStats } from '../lib/gating'
import { ProgressBar } from '../components/ProgressBar'

const TYPE_LABEL: Record<string, string> = {
  capitulo: '📖 Capítulo',
  guia: '📋 Guía',
  evaluacion: '✏️ Evaluación',
}

export function SchoolPage() {
  const { schoolId } = useParams()
  const { progress } = useProgress()
  const school = findSchool(schoolId)
  if (!school) return <Navigate to="/" replace />

  const items = orderedCatalog(CATALOG.filter((i) => i.school === school.id))
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
        {items.map((item, idx) => {
          const completed = isItemCompleted(item.slug, progress)
          const locked = isItemLocked(item.slug, CATALOG, progress)
          const isEval = item.type === 'evaluacion'

          if (locked) {
            return (
              <div
                key={item.slug}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 opacity-50"
              >
                <span className="text-lg text-slate-300">🔒</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-400">{item.title}</p>
                  <p className="text-xs text-slate-300">
                    {TYPE_LABEL[item.type] ?? '📄'} • Completa el anterior para desbloquear
                  </p>
                </div>
              </div>
            )
          }

          return (
            <Link
              key={item.slug}
              to={`/item/${item.slug}`}
              className={[
                'flex items-center gap-3 rounded-lg border px-4 py-3 transition',
                completed
                  ? 'border-green-200 bg-green-50 hover:bg-green-100'
                  : isEval
                    ? 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
              ].join(' ')}
            >
              <span className="text-lg">{completed ? '✅' : isEval ? '✏️' : idx === 0 || !locked ? '📖' : '🔒'}</span>
              <div className="flex-1">
                <p
                  className={
                    completed
                      ? 'text-sm text-slate-500 line-through'
                      : isEval
                        ? 'text-sm font-semibold text-amber-800'
                        : 'text-sm font-medium text-slate-800'
                  }
                >
                  {item.title}
                </p>
                <p className="text-xs text-slate-400">
                  {TYPE_LABEL[item.type] ?? '📄'} • {item.durationMin} min
                  {item.code ? ` • ${item.code}` : ''}
                </p>
              </div>
              {isEval && !completed && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {item.evalScope === 'final' ? 'Test Final' : 'Test de Escuela'}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
