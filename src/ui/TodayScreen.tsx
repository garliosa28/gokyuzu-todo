import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { byDayPart, morningReview, shouldCloseReview, todayView } from '../data/today'
import { store } from './context'
import { DAY_PART_LABELS } from './format'
import { MorningReview } from './MorningReview'
import { QuickAdd } from './QuickAdd'
import { TaskItem } from './TaskItem'
import { usePendingUndo } from './undo'
import { useDayPart, useToday } from './useToday'

/** Bugün görevlerinin bölüm sırası; bölümsüzler en sonda. */
const DAY_SECTIONS = ['morning', 'afternoon', 'evening', 'anytime'] as const
const CLOSE_REVIEW_DELAY_MS = 800

export function TodayScreen() {
  const today = useToday()
  const nowPart = useDayPart()
  const tasks = useLiveQuery(() => store.allTasks(), [])
  const lists = useLiveQuery(() => store.lists(), [])
  // useLiveQuery yüklenirken undefined döner; null ise "hiç gözden geçirilmedi" anlamına gelir.
  const reviewedOn = useLiveQuery(() => store.reviewedOn(), [])
  const shownOn = useLiveQuery(() => store.reviewShownOn(), [])
  const loaded = tasks !== undefined && lists !== undefined && reviewedOn !== undefined && shownOn !== undefined
  const review = loaded ? morningReview(tasks, today, reviewedOn) : []
  const showingReview = review.length > 0
  // Geri al bandı açıkken günü kapatma: kartın son görevi geri alınırsa kart da geri gelmeli.
  const undoPending = usePendingUndo() !== null
  const closeReview = loaded && !undoPending && shouldCloseReview(review, today, reviewedOn, shownOn)

  useEffect(() => {
    if (showingReview && shownOn !== today) store.markReviewShown(today)
  }, [showingReview, shownOn, today])

  // Kapatma kısa bir gecikmeyle yapılır ve kart bu arada yeniden dolarsa iptal edilir: geri alınan
  // bir karar veritabanına yansıyıp ekrana ulaşana kadar kart bir an boş görünebilir.
  useEffect(() => {
    if (!closeReview) return
    const timer = setTimeout(() => store.markReviewed(today), CLOSE_REVIEW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [closeReview, today])

  if (!loaded) return null
  const view = todayView(tasks, today)
  const byPart = byDayPart(view.today)

  return (
    <>
      <header className="header">
        <h1>Bugün</h1>
      </header>
      <main className="content">
        <QuickAdd placeholder="Bugün için görev ekle…" onAdd={(title) => store.addTask(title, { dueDate: today })} />
        {showingReview && <MorningReview tasks={review} today={today} />}
        {review.length === 0 && view.overdue.length > 0 && (
          <>
            <h2 className="section-title overdue">Gecikmiş</h2>
            <ul className="tasks">
              {view.overdue.map((t) => <TaskItem key={t.id} task={t} today={today} lists={lists} showList />)}
            </ul>
          </>
        )}
        {DAY_SECTIONS.map((part) => {
          const items = byPart[part]
          if (items.length === 0) return null
          return (
            <section key={part} aria-label={DAY_PART_LABELS[part]}>
              <h2 className={`section-title${part === nowPart ? ' now' : ''}`}>
                {DAY_PART_LABELS[part]}
                {part === nowPart && <span className="now-mark"> · şimdi</span>}
              </h2>
              <ul className="tasks">
                {items.map((t) => (
                  <TaskItem key={t.id} task={t} today={today} lists={lists} showList showDayPart={false} />
                ))}
              </ul>
            </section>
          )
        })}
        {view.overdue.length === 0 && view.today.length === 0 && <p className="empty">Bugün için görev yok.</p>}
      </main>
    </>
  )
}
