import { useLiveQuery } from 'dexie-react-hooks'
import { INBOX_ID } from '../data/types'
import { store } from './context'
import { QuickAdd } from './QuickAdd'
import { TaskItem } from './TaskItem'

export function App() {
  const tasks = useLiveQuery(() => store.tasksInList(INBOX_ID), [])

  return (
    <div className="app">
      <header className="header">
        <h1>Gelen Kutusu</h1>
      </header>
      <main className="content">
        <QuickAdd onAdd={(title) => store.addTask(title)} />
        <ul className="tasks">
          {tasks?.map((t) => <TaskItem key={t.id} task={t} />)}
        </ul>
        {tasks?.length === 0 && <p className="empty">Henüz görev yok.</p>}
      </main>
    </div>
  )
}
