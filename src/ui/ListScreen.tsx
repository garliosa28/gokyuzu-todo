import { useLiveQuery } from 'dexie-react-hooks'
import { db, store } from './context'
import { QuickAdd } from './QuickAdd'
import { TaskList } from './TaskList'
import { useToday } from './useToday'

export function ListScreen({ listId, onBack }: { listId: string; onBack?: () => void }) {
  const today = useToday()
  const list = useLiveQuery(() => db.lists.get(listId), [listId])
  const tasks = useLiveQuery(() => store.tasksInList(listId), [listId])
  const lists = useLiveQuery(() => store.lists(), []) ?? []
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
        {list?.deleted_at ? (
          <p className="empty">Bu liste başka bir cihazda silindi.</p>
        ) : (
          <QuickAdd onAdd={(title) => store.addTask(title, { listId })} />
        )}
        <TaskList tasks={open} today={today} lists={lists} context="list" />
        {done.length > 0 && (
          <>
            <h2 className="section-title">Tamamlanan</h2>
            <TaskList tasks={done} today={today} lists={lists} context="list" />
          </>
        )}
        {tasks?.length === 0 && <p className="empty">Henüz görev yok.</p>}
      </main>
    </>
  )
}
