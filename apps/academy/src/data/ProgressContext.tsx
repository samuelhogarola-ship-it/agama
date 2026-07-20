import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchProgress, saveLessonComplete } from './progressStore'
import type { ProgressMap } from '../lib/types'

interface ProgressContextValue {
  progress: ProgressMap
  loading: boolean
  completeLesson: (lessonSlug: string) => Promise<void>
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<ProgressMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setProgress({})
      setLoading(false)
      return
    }
    setLoading(true)
    fetchProgress(user.id)
      .then((map) => {
        if (!cancelled) setProgress(map)
      })
      .catch(() => {
        if (!cancelled) setProgress({})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  async function completeLesson(lessonSlug: string): Promise<void> {
    if (!user) return
    const completedAt = await saveLessonComplete(user.id, lessonSlug)
    setProgress((prev) => ({ ...prev, [lessonSlug]: completedAt }))
  }

  return (
    <ProgressContext.Provider value={{ progress, loading, completeLesson }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress debe usarse dentro de <ProgressProvider>')
  return ctx
}
