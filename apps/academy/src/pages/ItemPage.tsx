import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { findContentItem } from '../data/catalog'
import { CATALOG } from '../data/catalog'
import { findSchool } from '../data/schools'
import { useProgress } from '../data/ProgressContext'
import { isItemCompleted, isItemLocked } from '../lib/gating'
import type { QuizQuestion } from '../lib/types'

// ─── Quiz component ──────────────────────────────────────────────────────────

interface QuizState {
  answers: Record<string, number>  // questionId → chosen option index
  submitted: boolean
}

const PASS_THRESHOLD = 0.7

function QuizView({
  questions,
  onPass,
}: {
  questions: QuizQuestion[]
  onPass: () => void
}) {
  const [state, setState] = useState<QuizState>({ answers: {}, submitted: false })

  const allAnswered = questions.every((q) => state.answers[q.id] !== undefined)
  const score = questions.filter((q) => state.answers[q.id] === q.correct).length
  const pct = score / questions.length
  const passed = pct >= PASS_THRESHOLD

  function choose(qId: string, optIdx: number) {
    if (state.submitted) return
    setState((s) => ({ ...s, answers: { ...s.answers, [qId]: optIdx } }))
  }

  function submit() {
    setState((s) => ({ ...s, submitted: true }))
    if (passed) onPass()
  }

  function retry() {
    setState({ answers: {}, submitted: false })
  }

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => {
        const chosen = state.answers[q.id]
        const isCorrect = chosen === q.correct
        return (
          <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-medium text-slate-800">
              <span className="mr-2 font-mono text-xs text-slate-400">{qi + 1}.</span>
              {q.question}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => {
                let cls =
                  'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition cursor-pointer'
                if (!state.submitted) {
                  cls +=
                    chosen === oi
                      ? ' border-blue-500 bg-blue-50 text-blue-800'
                      : ' border-slate-200 hover:bg-slate-50 text-slate-700'
                } else {
                  if (oi === q.correct) {
                    cls += ' border-green-500 bg-green-50 text-green-800 font-medium'
                  } else if (chosen === oi && oi !== q.correct) {
                    cls += ' border-red-300 bg-red-50 text-red-700'
                  } else {
                    cls += ' border-slate-200 text-slate-400'
                  }
                }
                return (
                  <label key={oi} className={cls} onClick={() => choose(q.id, oi)}>
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-current text-xs">
                      {state.submitted && oi === q.correct
                        ? '✓'
                        : state.submitted && chosen === oi && oi !== q.correct
                          ? '✗'
                          : String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </label>
                )
              })}
            </div>
            {state.submitted && q.explanation && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                💡 {q.explanation}
              </p>
            )}
            {state.submitted && (
              <p className={`mt-2 text-xs font-medium ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                {isCorrect ? '✅ Correcto' : '❌ Incorrecto'}
              </p>
            )}
          </div>
        )
      })}

      {!state.submitted ? (
        <div className="flex justify-end">
          <button
            onClick={submit}
            disabled={!allAnswered}
            className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-40"
          >
            Enviar respuestas
          </button>
        </div>
      ) : (
        <div
          className={`rounded-2xl border-2 p-6 text-center ${
            passed ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'
          }`}
        >
          <p className="text-4xl">{passed ? '🎉' : '📚'}</p>
          <p className={`mt-2 text-xl font-bold ${passed ? 'text-green-700' : 'text-red-600'}`}>
            {passed ? '¡Aprobado!' : 'Sigue estudiando'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {score} de {questions.length} correctas ({Math.round(pct * 100)}%)
            {passed ? ' — Mínimo para aprobar: 70%' : ` — Necesitas al menos ${Math.ceil(questions.length * PASS_THRESHOLD)} correctas`}
          </p>
          {!passed && (
            <button
              onClick={retry}
              className="mt-4 rounded-xl bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Intentar de nuevo
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Item placeholder ─────────────────────────────────────────────────────────

function ItemPlaceholder({ summary }: { summary: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 p-8 text-center text-slate-400">
      <p className="font-medium">{summary}</p>
      <p className="mt-2 text-sm">El contenido se cargará próximamente.</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ItemPage() {
  const { itemSlug } = useParams()
  const { progress, completeLesson } = useProgress()
  const [saving, setSaving] = useState(false)

  const item = findContentItem(itemSlug)
  if (!item) return <Navigate to="/" replace />

  const school = findSchool(item.school)
  const completed = isItemCompleted(item.slug, progress)
  const locked = isItemLocked(item.slug, CATALOG, progress)

  async function markComplete() {
    if (!item) return
    setSaving(true)
    try {
      await completeLesson(item.slug)
    } finally {
      setSaving(false)
    }
  }

  const isEval = item.type === 'evaluacion'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link to={`/escuela/${item.school}`} className="text-sm text-blue-600 hover:underline">
          ← {school?.name}
        </Link>
        <div className="mt-3 flex items-start gap-3">
          <span className="text-2xl">{school?.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{item.title}</h1>
              {isEval && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {item.evalScope === 'final' ? 'Test Final' : 'Test de Escuela'}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">{item.summary}</p>
            {item.code && <p className="mt-2 text-xs font-mono text-slate-400">{item.code}</p>}
          </div>
        </div>
      </div>

      {/* Locked */}
      {locked ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 p-10 text-center text-slate-400">
          <p className="text-4xl">🔒</p>
          <p className="mt-3 font-semibold text-slate-500">Contenido bloqueado</p>
          <p className="mt-2 text-sm">Completa el item anterior para desbloquear este.</p>
          <Link
            to={`/escuela/${item.school}`}
            className="mt-4 inline-block text-sm text-blue-500 hover:underline"
          >
            Volver a {school?.name}
          </Link>
        </div>
      ) : isEval && item.quiz ? (
        // Quiz mode
        <>
          {completed ? (
            <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6 text-center">
              <p className="text-4xl">🎉</p>
              <p className="mt-2 text-lg font-bold text-green-700">¡Evaluación superada!</p>
              <Link
                to={`/escuela/${item.school}`}
                className="mt-3 inline-block rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Volver a {school?.name}
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>Instrucciones:</strong> Responde todas las preguntas y envía. Necesitas un{' '}
                <strong>70% o más</strong> para aprobar. Puedes repetirla las veces que necesites.
              </div>
              <QuizView questions={item.quiz} onPass={() => void markComplete()} />
            </>
          )}
        </>
      ) : (
        // Content mode
        <>
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
                <p className="flex-1 text-sm text-slate-500">
                  Marca este item como completado cuando termines de leerlo.
                </p>
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
        </>
      )}
    </div>
  )
}
