import { useLiveQuery } from 'dexie-react-hooks'
import { morningReview, todayView } from '../data/today'
import { store } from './context'
import { MorningReview } from './MorningReview'
import { QuickAdd } from './QuickAdd'
import { TaskItem } from './TaskItem'
import { useToday } from './useToday'

export function TodayScreen() {
  const today = useToday()
  const tasks = useLiveQuery(() => store.allTasks(), [])
  // useLiveQuery yüklenirken undefined döner; null ise "hiç gözden geçirilmedi" anlamına gelir.
  const reviewedOn = useLiveQuery(() => store.reviewedOn(), [])
  if (!tasks || reviewedOn === undefined) return null
  const view = todayView(tasks, today)
  const review = morningReview(tasks, today, reviewedOn)

  return (
    <>
      <header className="header">
        <h1>Bugün</h1>
      </header>
      <main className="content">
        <QuickAdd placeholder="Bugün için görev ekle…" onAdd={(title) => store.addTask(title, { dueDate: today })} />
        {review.length > 0 && <MorningReview tasks={review} today={today} />}
        {review.length === 0 && view.overdue.length > 0 && (
          <>
            <h2 className="section-title overdue">Gecikmiş</h2>
            <ul className="tasks">
              {view.overdue.map((t) => <TaskItem key={t.id} task={t} today={today} showList />)}
            </ul>
          </>
        )}
        {view.overdue.length > 0 && view.today.length > 0 && <h2 className="section-title">Bugün</h2>}
        <ul className="tasks">
          {view.today.map((t) => <TaskItem key={t.id} task={t} today={today} showList />)}
        </ul>
        {view.overdue.length === 0 && view.today.length === 0 && <p className="empty">Bugün için görev yok.</p>}
      </main>
    </>
  )
}
