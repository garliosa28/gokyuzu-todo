import { addDays } from '../data/today'
import type { Task } from '../data/types'
import { store } from './context'
import { EASE_IN, fadeOut, play, reducedMotion } from './motion'
import { offerUndo } from './undo'

/** Satırın ekrandan çıkış biçimi: düşme (silme), ufka kayma (erteleme), yana kayma (taşıma). */
export type Exit = 'fall' | 'horizon' | 'aside'

const EXITS: Record<Exit, { keyframes: Keyframe[]; duration: number }> = {
  fall: {
    keyframes: [
      { transform: 'translateY(0) rotate(0)', opacity: 1 },
      { transform: 'translateY(4px) rotate(-1deg)', opacity: 1, offset: 0.25 },
      { transform: 'translateY(90px) rotate(-5deg)', opacity: 0 },
    ],
    duration: 340,
  },
  horizon: {
    keyframes: [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: 'translate(70%, -26px) scale(0.86)', opacity: 0 },
    ],
    duration: 360,
  },
  aside: {
    keyframes: [
      { transform: 'translateX(0)', opacity: 1 },
      { transform: 'translateX(-48px)', opacity: 0 },
    ],
    duration: 260,
  },
}

/**
 * Önce satır çıkış hareketini yapar, sonra değişikliği yazar. Değişiklikten sonra satır hâlâ
 * ekrandaysa (ör. liste ekranında ertelenen görev listede kalır) görünür hâle geri getirilir.
 */
async function leaving(row: HTMLElement | null | undefined, exit: Exit, commit: () => Promise<void>) {
  if (row) {
    if (reducedMotion()) await fadeOut(row)
    else await play(row, EXITS[exit].keyframes, { duration: EXITS[exit].duration, easing: EASE_IN, fill: 'forwards' })
  }
  await commit()
  if (row) requestAnimationFrame(() => row.isConnected && row.getAnimations().forEach((a) => a.cancel()))
}

export function planForToday(task: Task, today: string, row?: HTMLElement | null) {
  return leaving(row, 'aside', () => offerUndo(`Bugüne alındı: ${task.title}`, store.updateTask(task.id, { due_date: today })))
}

export function postponeToTomorrow(task: Task, today: string, row?: HTMLElement | null) {
  return leaving(row, 'horizon', () =>
    offerUndo(`Yarına ertelendi: ${task.title}`, store.updateTask(task.id, { due_date: addDays(today, 1) })),
  )
}

export function deleteWithUndo(task: Task, row?: HTMLElement | null) {
  return leaving(row, 'fall', () => offerUndo(`Silindi: ${task.title}`, store.deleteTask(task.id)))
}

export function moveToList(task: Task, listId: string, listName: string, row?: HTMLElement | null) {
  return leaving(row, 'aside', () => offerUndo(`${listName} listesine taşındı: ${task.title}`, store.updateTask(task.id, { list_id: listId })))
}
