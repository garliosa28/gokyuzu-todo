import type { DateString, Task } from './types'

/** Cihazın yerel saatine göre 'YYYY-MM-DD'. */
export function toDateString(date: Date): DateString {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(day: DateString, days: number): DateString {
  const [y, m, d] = day.split('-').map(Number)
  return toDateString(new Date(y, m - 1, d + days))
}

const byDueThenOrder = (a: Task, b: Task) =>
  (a.due_date ?? '').localeCompare(b.due_date ?? '') || a.sort_order - b.sort_order

export function todayView(tasks: Task[], today: DateString): { overdue: Task[]; today: Task[] } {
  const live = tasks.filter((t) => !t.deleted_at && t.due_date)
  return {
    overdue: live.filter((t) => !t.done && t.due_date! < today).sort(byDueThenOrder),
    today: live
      .filter((t) => t.due_date === today)
      .sort((a, b) => Number(a.done) - Number(b.done) || a.sort_order - b.sort_order),
  }
}

/** Günün ilk açılışında sorulacak, önceki günlerden kalmış yapılmamış görevler. */
export function morningReview(tasks: Task[], today: DateString, reviewedOn: DateString | null): Task[] {
  if (reviewedOn === today) return []
  return todayView(tasks, today).overdue
}
