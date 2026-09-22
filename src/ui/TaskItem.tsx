import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { addDays } from '../data/today'
import type { Task } from '../data/types'
import { store } from './context'
import { dueLabel } from './format'

export function TaskItem({ task, today, showList = false }: { task: Task; today: string; showList?: boolean }) {
  const [editing, setEditing] = useState(false)
  const lists = useLiveQuery(() => store.lists(), [])
  const listName = lists?.find((l) => l.id === task.list_id)?.name
  const overdue = !task.done && task.due_date !== null && task.due_date < today

  const meta = [
    task.due_date && task.due_date !== today ? dueLabel(task.due_date, today) : null,
    showList ? listName : null,
  ].filter(Boolean)

  return (
    <li className={`task${task.done ? ' done' : ''}`}>
      <div className="task-row">
        <button className="check" aria-label={task.done ? 'Geri al' : 'Tamamla'} onClick={() => store.toggleTask(task.id)}>
          {task.done ? '✓' : ''}
        </button>
        <button className="task-main" onClick={() => setEditing(!editing)} aria-expanded={editing}>
          <span className="title">{task.title}</span>
          {meta.length > 0 && <span className={`meta${overdue ? ' overdue' : ''}`}>{meta.join(' · ')}</span>}
        </button>
      </div>
      {editing && (
        <div className="editor">
          <input
            defaultValue={task.title}
            aria-label="Başlık"
            onBlur={(e) => {
              const title = e.target.value
              if (title.trim() && title !== task.title) store.updateTask(task.id, { title })
            }}
          />
          <div className="chips">
            <button onClick={() => store.updateTask(task.id, { due_date: today })}>Bugün</button>
            <button onClick={() => store.updateTask(task.id, { due_date: addDays(today, 1) })}>Yarın</button>
            <input
              type="date"
              aria-label="Son tarih"
              value={task.due_date ?? ''}
              onChange={(e) => store.updateTask(task.id, { due_date: e.target.value || null })}
            />
            {task.due_date && <button onClick={() => store.updateTask(task.id, { due_date: null })}>Tarihi kaldır</button>}
          </div>
          <div className="editor-row">
            <select
              aria-label="Liste"
              value={task.list_id}
              onChange={(e) => store.updateTask(task.id, { list_id: e.target.value })}
            >
              {lists?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <button className="danger" onClick={() => store.deleteTask(task.id)}>
              Sil
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
