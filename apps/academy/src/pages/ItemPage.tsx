import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { findContentItem } from '../data/catalog'
import { findSchool } from '../data/schools'
import { useProgress } from '../data/ProgressContext'
import { isItemCompleted } from '../lib/gating'

function ItemPlaceholder({ summary }: { summary: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 p-8 text-center text-slate-400">
      <p className="font-medium">{summary}</p>
      <p className="mt-2 text-sm">El contenido se cargará próximamente.</p>
    </div>
  )
}

export function ItemPage() {
  const { itemSlug } = useParams()
  const { progress, completeLesson } = useProgress()
  const [saving, setSaving] = useState(false)

  const item = findContentItem(itemSlug)
  if (!item) return <Navigate to="/" replace />

  const school = findSchool(item.school)
  const completed = isItemCompleted(item.slug, progress)

  async function markComplete() {
    if (!item) return
    setSaving(true)
    try {
      await completeLesson(item.slug)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to={`/escuela/${item.school}`} className="text-sm text-blue-600 hover:underline">
          ← {school?.name}
        </Link>
        <div className="mt-3 flex items-start gap-3">
          <span className="text-2xl">{school?.icon}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">{item.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{item.summary}</p>
            {item.code && <p className="mt-2 text-xs font-mono text-slate-400">{item.code}</p>}
          </div>
        </div>
      </div>

      {item.body ? (
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
          <section>
            <h2 className="text-lg font-semibold text-slate-800">🎯 Objetivo</h2>
            <p className="mt-2 text-slate-600">{item.body.objetivo}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">📚 Contenido</h2>
            <div className="mt-3 space-y-3">
              {item.body.contenido.map((para, i) => (
                <p key={i} className="text-slate-600">
                  {para}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-900">💡 Idea principal</h3>
            <p className="mt-2 text-blue-800">{item.body.ideaPrincipal}</p>
          </section>

          {item.body.relacionados.length > 0 && (
            <section>
              <h3 className="font-semibold text-slate-800">🏷️ Fundamentos relacionados</h3>
              <ul className="mt-2 space-y-1">
                {item.body.relacionados.map((rel, i) => (
                  <li key={i} className="text-sm text-slate-600">
                    • {rel}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-lg bg-amber-50 p-4">
            <h3 className="font-semibold text-amber-900">💬 Frase fundacional</h3>
            <p className="mt-2 text-amber-800">"{item.body.fraseFundacional}"</p>
          </section>
        </div>
      ) : (
        <ItemPlaceholder summary={item.summary} />
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        {completed ? (
          <>
            <p className="flex-1 text-sm font-medium text-green-700">✅ Completado</p>
            <Link
              to={`/escuela/${item.school}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Volver a {school?.name}
            </Link>
          </>
        ) : (
          <>
            <p className="flex-1 text-sm text-slate-500">Marca este item como completado cuando termines.</p>
            <button
              onClick={() => void markComplete()}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Marcar completado'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
