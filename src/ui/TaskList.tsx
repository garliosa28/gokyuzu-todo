import { useRef } from 'react'
import type { List, Task } from '../data/types'
import { TaskItem, type TaskContext } from './TaskItem'
import { useFlipList } from './useFlipList'

interface Props {
  tasks: Task[]
  today: string
  lists: List[]
  context: TaskContext
  showList?: boolean
  showDayPart?: boolean
}

/** Görev listesi: satırlar yer değiştirince kayar, yeni görev düşüp yerine oturur. */
export function TaskList({ tasks, ...item }: Props) {
  const ref = useRef<HTMLUListElement>(null)
  useFlipList(ref)
  return (
    <ul ref={ref} className="tasks">
      {tasks.map((t) => (
        <TaskItem key={t.id} task={t} {...item} />
      ))}
    </ul>
  )
}
