import type { ContentItem } from './types'
import type { ProgressMap } from './types'

export function isItemCompleted(slug: string, progress: ProgressMap): boolean {
  return Boolean(progress[slug])
}

export function firstPendingItem(items: ContentItem[], progress: ProgressMap): ContentItem | null {
  return items.find((i) => !isItemCompleted(i.slug, progress)) ?? null
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
