import { addDays } from '../data/today'
import { store } from './context'

export function planForToday(id: string, today: string) {
  return store.updateTask(id, { due_date: today })
}

export function postponeToTomorrow(id: string, today: string) {
  return store.updateTask(id, { due_date: addDays(today, 1) })
}
