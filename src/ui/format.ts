import { addDays, parseDateString } from '../data/today'
import type { DayPart } from '../data/types'

const short = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' })

export function dueLabel(due: string, today: string): string {
  if (due === today) return 'Bugün'
  if (due === addDays(today, 1)) return 'Yarın'
  if (due === addDays(today, -1)) return 'Dün'
  return short.format(parseDateString(due))
}

export const DAY_PART_LABELS: Record<DayPart | 'anytime', string> = {
  morning: 'Sabah',
  afternoon: 'Öğle',
  evening: 'Akşam',
  anytime: 'Gün içinde',
}
