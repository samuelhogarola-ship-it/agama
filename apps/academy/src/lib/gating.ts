import type { ContentItem, SchoolId } from './types'
import type { ProgressMap } from './types'
import { SCHOOL_ORDER } from '../data/schools'

export function isItemCompleted(slug: string, progress: ProgressMap): boolean {
  return Boolean(progress[slug])
}

/** Global canonical order: school order, then catalog position within each school. */
export function orderedCatalog(items: ContentItem[]): ContentItem[] {
  const bySchool = new Map<SchoolId, ContentItem[]>()
  for (const item of items) {
    const group = bySchool.get(item.school) ?? []
    group.push(item)
    bySchool.set(item.school, group)
  }
  const result: ContentItem[] = []
  for (const schoolId of SCHOOL_ORDER) {
    const group = bySchool.get(schoolId) ?? []
    result.push(...group)
  }
  // Items not assigned to a known school go last
  for (const item of items) {
    if (!SCHOOL_ORDER.includes(item.school)) result.push(item)
  }
  return result
}

export function isItemLocked(slug: string, allItems: ContentItem[], progress: ProgressMap): boolean {
  const ordered = orderedCatalog(allItems)
  const idx = ordered.findIndex((i) => i.slug === slug)
  if (idx <= 0) return false
  const prev = ordered[idx - 1]
  return !isItemCompleted(prev.slug, progress)
}

export function isSchoolLocked(schoolId: SchoolId, allItems: ContentItem[], progress: ProgressMap): boolean {
  const schoolIdx = SCHOOL_ORDER.indexOf(schoolId)
  if (schoolIdx <= 0) return false
  const prevSchoolId = SCHOOL_ORDER[schoolIdx - 1]
  // Previous school is unlocked when its evaluación is completed
  const prevSchoolItems = allItems.filter((i) => i.school === prevSchoolId)
  if (prevSchoolItems.length === 0) return false
  const prevLast = orderedCatalog(prevSchoolItems).at(-1)!
  return !isItemCompleted(prevLast.slug, progress)
}

export function firstPendingItem(items: ContentItem[], progress: ProgressMap): ContentItem | null {
  return orderedCatalog(items).find((i) => !isItemCompleted(i.slug, progress)) ?? null
}

export interface Stats {
  done: number
  total: number
  pct: number
}

function stats(items: ContentItem[], progress: ProgressMap): Stats {
  const total = items.length
  const done = items.filter((i) => isItemCompleted(i.slug, progress)).length
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
}

export function schoolStats(items: ContentItem[], progress: ProgressMap): Stats {
  return stats(items, progress)
}

export function overallStats(items: ContentItem[], progress: ProgressMap): Stats {
  return stats(items, progress)
}
