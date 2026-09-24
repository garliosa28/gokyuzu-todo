import { addDays } from '../data/today'
import type { Task } from '../data/types'
import { store } from './context'
import { offerUndo } from './undo'

export function planForToday(task: Task, today: string) {
  return offerUndo(`Bugüne alındı: ${task.title}`, store.updateTask(task.id, { due_date: today }))
}

export function postponeToTomorrow(task: Task, today: string) {
  return offerUndo(`Yarına ertelendi: ${task.title}`, store.updateTask(task.id, { due_date: addDays(today, 1) }))
}

export function deleteWithUndo(task: Task) {
  return offerUndo(`Silindi: ${task.title}`, store.deleteTask(task.id))
}
