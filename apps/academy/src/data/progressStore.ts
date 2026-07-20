import { DEMO_MODE, supabase } from '../lib/supabaseClient'
import type { ProgressMap } from '../lib/types'

const demoKey = (userId: string) => `academy-progress-${userId}`

/** Guest/demo users (id starts with "demo-") always use localStorage. */
const isLocalUser = (userId: string) => DEMO_MODE || !supabase || userId.startsWith('demo-')

export async function fetchProgress(userId: string): Promise<ProgressMap> {
  if (isLocalUser(userId)) {
    try {
      return JSON.parse(localStorage.getItem(demoKey(userId)) ?? '{}') as ProgressMap
    } catch {
      return {}
    }
  }
  const { data, error } = await supabase!
    .from('academy_lesson_progress')
    .select('lesson_slug, completed_at')
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  const map: ProgressMap = {}
  for (const row of data ?? []) {
    map[row.lesson_slug as string] = row.completed_at as string
  }
  return map
}

export async function saveLessonComplete(userId: string, lessonSlug: string): Promise<string> {
  const completedAt = new Date().toISOString()
  if (isLocalUser(userId)) {
    const current = await fetchProgress(userId)
    current[lessonSlug] = completedAt
    localStorage.setItem(demoKey(userId), JSON.stringify(current))
    return completedAt
  }
  const { error } = await supabase!
    .from('academy_lesson_progress')
    .upsert({ user_id: userId, lesson_slug: lessonSlug, completed_at: completedAt })
  if (error) throw new Error(error.message)
  return completedAt
}
