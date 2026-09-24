import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { morningReview, shouldCloseReview, todayView } from '../data/today'
import { store } from './context'
import { MorningReview } from './MorningReview'
import { QuickAdd } from './QuickAdd'
import { TaskItem } from './TaskItem'
import { useToday } from './useToday'

export function TodayScreen() {
  const today = useToday()
  const tasks = useLiveQuery(() => store.allTasks(), [])
  const lists = useLiveQuery(() => store.lists(), [])
  // useLiveQuery yüklenirken undefined döner; null ise "hiç gözden geçirilmedi" anlamına gelir.
  const reviewedOn = useLiveQuery(() => store.reviewedOn(), [])
  const shownOn = useLiveQuery(() => store.reviewShownOn(), [])
  const loaded = tasks !== undefined && lists !== undefined && reviewedOn !== undefined && shownOn !== undefined
  const review = loaded ? morningReview(tasks, today, reviewedOn) : []
  const showingReview = review.length > 0
  const closeReview = loaded && shouldCloseReview(review, today, reviewedOn, shownOn)

  useEffect(() => {
    if (showingReview && shownOn !== today) store.markReviewShown(today)
  }, [showingReview, shownOn, today])

  useEffect(() => {
    if (closeReview) store.markReviewed(today)
  }, [closeReview, today])

  if (!loaded) return null
  const view = todayView(tasks, today)

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
        {view.overdue.length > 0 && view.today.length > 0 && <h2 className="section-title">Bugün</h2>}
        <ul className="tasks">
          {view.today.map((t) => <TaskItem key={t.id} task={t} today={today} lists={lists} showList />)}
        </ul>
        {view.overdue.length === 0 && view.today.length === 0 && <p className="empty">Bugün için görev yok.</p>}
      </main>
    </>
  )
}
