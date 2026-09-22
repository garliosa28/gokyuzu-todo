import { addDays } from '../data/today'
import type { Task } from '../data/types'
import { store } from './context'
import { dueLabel } from './format'

export function MorningReview({ tasks, today }: { tasks: Task[]; today: string }) {
  return (
    <section className="review" aria-label="Sabah gözden geçirmesi">
      <div className="review-head">
        <strong>Dünden kalanlar ({tasks.length})</strong>
        <button className="link" onClick={() => store.markReviewed(today)}>
          Sonra bakarım
        </button>
      </div>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <span className="review-title">
              {t.title}
              <span className="meta"> · {dueLabel(t.due_date!, today)}</span>
            </span>
            <span className="review-actions">
              <button onClick={() => store.updateTask(t.id, { due_date: today })}>Bugün</button>
              <button onClick={() => store.updateTask(t.id, { due_date: addDays(today, 1) })}>Ertele</button>
              <button aria-label={`${t.title} görevini sil`} onClick={() => store.deleteTask(t.id)}>
                Sil
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
