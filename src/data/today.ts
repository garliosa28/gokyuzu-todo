import type { DateString, DayPart, Task } from './types'

/** Cihazın yerel saatine göre 'YYYY-MM-DD'. */
export function toDateString(date: Date): DateString {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 'YYYY-MM-DD' → o günün yerel gece yarısı. */
export function parseDateString(day: DateString): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(day: DateString, days: number): DateString {
  const date = parseDateString(day)
  date.setDate(date.getDate() + days)
  return toDateString(date)
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

/**
 * Kart bugün gösterildiyse ve içindekilerin hepsi halledildiyse gün kapanır: aynı gün sonradan
 * gecikmiş bir görev gelse de kart bir daha açılmaz. Kart hiç gösterilmediyse (açılışta kalan yoktu)
 * gün açık kalır; senkronla sonradan gelen kalanlar yine kartta sorulur.
 */
export function shouldCloseReview(
  review: Task[],
  today: DateString,
  reviewedOn: DateString | null,
  shownOn: DateString | null,
): boolean {
  return reviewedOn !== today && shownOn === today && review.length === 0
}

/** Görevleri günün bölümlerine ayırır; sıra korunur. anytime = bölümü olmayanlar ("gün içinde"). */
export function byDayPart(tasks: Task[]): Record<DayPart | 'anytime', Task[]> {
  const groups: Record<DayPart | 'anytime', Task[]> = { morning: [], afternoon: [], evening: [], anytime: [] }
  for (const t of tasks) groups[t.day_part ?? 'anytime'].push(t)
  return groups
}

/** Cihazın yerel saatine göre şu anki bölüm: 12.00 öncesi sabah, 17.00 öncesi öğle, sonrası akşam. */
export function currentDayPart(date: Date): DayPart {
  const h = date.getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}
