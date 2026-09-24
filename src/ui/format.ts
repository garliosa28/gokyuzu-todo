import { addDays, parseDateString } from '../data/today'

const short = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' })

export function dueLabel(due: string, today: string): string {
  if (due === today) return 'Bugün'
  if (due === addDays(today, 1)) return 'Yarın'
  if (due === addDays(today, -1)) return 'Dün'
  return short.format(parseDateString(due))
}
