import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Sin credenciales de Supabase la app funciona en modo demo (todo local). */
export const DEMO_MODE = !url || !anonKey

export const SUPABASE_URL = url ?? ''
export const SUPABASE_ANON_KEY = anonKey ?? ''

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null
