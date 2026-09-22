import { useLiveQuery } from 'dexie-react-hooks'
import { db, store } from './context'
import { QuickAdd } from './QuickAdd'
import { TaskItem } from './TaskItem'
import { useToday } from './useToday'

export function ListScreen({ listId, onBack }: { listId: string; onBack?: () => void }) {
  const today = useToday()
  const list = useLiveQuery(() => db.lists.get(listId), [listId])
  const tasks = useLiveQuery(() => store.tasksInList(listId), [listId])
  const open = tasks?.filter((t) => !t.done) ?? []
  const done = tasks?.filter((t) => t.done) ?? []

  return (
    <>
      <header className="header">
        {onBack && (
          <button className="back" onClick={onBack} aria-label="Listelere dön">
            ‹
          </button>
        )}
        <h1>{list?.name ?? ''}</h1>
      </header>
      <main className="content">
        <QuickAdd onAdd={(title) => store.addTask(title, { listId })} />
        <ul className="tasks">
          {open.map((t) => <TaskItem key={t.id} task={t} today={today} />)}
        </ul>
        {done.length > 0 && (
          <>
            <h2 className="section-title">Tamamlanan</h2>
            <ul className="tasks">
              {done.map((t) => <TaskItem key={t.id} task={t} today={today} />)}
            </ul>
          </>
        )}
        {tasks?.length === 0 && <p className="empty">Henüz görev yok.</p>}
      </main>
    </>
  )
}
