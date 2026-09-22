import type { Task } from '../data/types'
import { store } from './context'

export function TaskItem({ task }: { task: Task }) {
  return (
    <li className={`task${task.done ? ' done' : ''}`}>
      <button className="check" aria-label={task.done ? 'Geri al' : 'Tamamla'} onClick={() => store.toggleTask(task.id)}>
        {task.done ? '✓' : ''}
      </button>
      <span className="title">{task.title}</span>
      <button className="icon" aria-label="Sil" onClick={() => store.deleteTask(task.id)}>×</button>
    </li>
  )
}
