import { useEffect, useRef, useState } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import { BRAND } from '../config/brand'
import { findContentItem } from '../data/catalog'
import { findSchool } from '../data/schools'
import { useAuth } from '../auth/AuthContext'
import { DEMO_MODE, SUPABASE_ANON_KEY, SUPABASE_URL } from '../lib/supabaseClient'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

function useAssistantContext(): string {
  const location = useLocation()
  const itemMatch = matchPath('/item/:itemSlug', location.pathname)
  const schoolMatch = matchPath('/escuela/:schoolId', location.pathname)

  if (itemMatch?.params.itemSlug) {
    const item = findContentItem(itemMatch.params.itemSlug)
    const school = item ? findSchool(item.school) : undefined
    if (item && school) {
      return `El colaborador está leyendo "${item.title}" (${item.type}) de la escuela ${school.name}.`
    }
  }
  if (schoolMatch?.params.schoolId) {
    const school = findSchool(schoolMatch.params.schoolId)
    if (school) return `El colaborador está navegando la escuela ${school.name}.`
  }
  return `El colaborador está en el panel principal. Escuelas: ${BRAND.ecosystem}.`
}

export function AssistantWidget() {
  const { user } = useAuth()
  const contextNote = useAssistantContext()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    const history = [...messages, { role: 'user' as const, text }]
    setMessages(history)
    setInput('')
    setSending(true)
    try {
      let reply: string
      if (DEMO_MODE) {
        reply = `Hola, soy ${BRAND.assistantName} (modo demo). Todavía no estoy conectada a la IA: configura Supabase y despliega la función "assistant" con una ANTHROPIC_API_KEY para activarme. ${contextNote}`
      } else {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/academy-assistant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.text })),
            context: { note: contextNote, userName: user?.name ?? null },
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { reply?: string }
        reply = data.reply ?? 'No he podido generar una respuesta. Inténtalo de nuevo.'
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Ha ocurrido un error al contactar con el asistente. Inténtalo de nuevo en unos segundos.',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-blue-600 px-4 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">🦉</span>
            <div>
              <p className="text-sm font-semibold">{BRAND.assistantName}</p>
              <p className="text-xs text-blue-100">Tu guía de formación</p>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
                ¡Hola{user ? `, ${user.name.split(' ')[0]}` : ''}! Soy {BRAND.assistantName}. Pregúntame
                cualquier duda sobre tu formación o sobre la lección que estás viendo.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <p
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] rounded-xl bg-blue-600 px-3 py-2 text-sm text-white'
                      : 'max-w-[85%] rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700'
                  }
                >
                  {m.text}
                </p>
              </div>
            ))}
            {sending && <p className="text-xs text-slate-400">{BRAND.assistantName} está escribiendo…</p>}
          </div>
          <form
            className="flex gap-2 border-t border-slate-100 p-3"
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu duda…"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
      >
        <span className="text-lg">🦉</span>
        {open ? 'Cerrar' : BRAND.assistantName}
      </button>
    </div>
  )
}
