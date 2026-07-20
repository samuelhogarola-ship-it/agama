import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_MODE, supabase } from '../lib/supabaseClient'
import type { AcademyUser } from '../lib/types'

interface AuthContextValue {
  user: AcademyUser | null
  loading: boolean
  demoMode: boolean
  /** Devuelve un mensaje de error o null si todo fue bien. */
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (name: string, email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  loginAsGuest: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEMO_SESSION_KEY = 'academy-demo-session'
const DEMO_USERS_KEY = 'academy-demo-users'

interface DemoUserRecord {
  id: string
  name: string
  password: string
}

function readDemoUsers(): Record<string, DemoUserRecord> {
  try {
    return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AcademyUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (DEMO_MODE || !supabase) {
      try {
        const raw = localStorage.getItem(DEMO_SESSION_KEY)
        if (raw) {
          setUser(JSON.parse(raw) as AcademyUser)
        } else {
          // Auto-login as a default demo collaborator — no login screen in demo mode
          const demoUser: AcademyUser = { id: 'demo-default', email: 'colaborador@agama.mx', name: 'Colaborador' }
          localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser))
          setUser(demoUser)
        }
      } catch {
        setUser(null)
      }
      setLoading(false)
      return
    }

    const client = supabase
    client.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setUser(
        u
          ? {
              id: u.id,
              email: u.email ?? '',
              name: (u.user_metadata?.full_name as string) ?? u.email?.split('@')[0] ?? 'Colaborador',
            }
          : null,
      )
      setLoading(false)
    })

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      setUser(
        u
          ? {
              id: u.id,
              email: u.email ?? '',
              name: (u.user_metadata?.full_name as string) ?? u.email?.split('@')[0] ?? 'Colaborador',
            }
          : null,
      )
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string): Promise<string | null> {
    if (DEMO_MODE || !supabase) {
      const users = readDemoUsers()
      const record = users[email.toLowerCase()]
      if (!record) return 'Usuario no registrado (modo demo). Crea una cuenta primero.'
      if (record.password !== password) return 'Contraseña incorrecta.'
      const demoUser: AcademyUser = { id: record.id, email: email.toLowerCase(), name: record.name }
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser))
      setUser(demoUser)
      return null
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return error.message
    // Best-effort: asegura la fila de perfil (sin trigger sobre auth.users en producción)
    if (data.user) {
      void supabase.from('academy_profiles').upsert({
        id: data.user.id,
        full_name: (data.user.user_metadata?.full_name as string) ?? '',
      })
    }
    return null
  }

  async function signUp(name: string, email: string, password: string): Promise<string | null> {
    if (DEMO_MODE || !supabase) {
      const users = readDemoUsers()
      const key = email.toLowerCase()
      if (users[key]) return 'Ese correo ya está registrado (modo demo).'
      const record: DemoUserRecord = { id: crypto.randomUUID(), name, password }
      users[key] = record
      localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users))
      const demoUser: AcademyUser = { id: record.id, email: key, name }
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser))
      setUser(demoUser)
      return null
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    return error ? error.message : null
  }

  function loginAsGuest(): void {
    const guestUser: AcademyUser = { id: 'demo-default', email: 'colaborador@agama.mx', name: 'Colaborador' }
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(guestUser))
    setUser(guestUser)
  }

  async function signOut(): Promise<void> {
    localStorage.removeItem(DEMO_SESSION_KEY)
    if (DEMO_MODE || !supabase) {
      setUser(null)
      return
    }
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, demoMode: DEMO_MODE, signIn, signUp, signOut, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
