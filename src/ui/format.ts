import { addDays } from '../data/today'

const short = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' })

export function dueLabel(due: string, today: string): string {
  if (due === today) return 'Bugün'
  if (due === addDays(today, 1)) return 'Yarın'
  if (due === addDays(today, -1)) return 'Dün'
  const [y, m, d] = due.split('-').map(Number)
  return short.format(new Date(y, m - 1, d))
}
