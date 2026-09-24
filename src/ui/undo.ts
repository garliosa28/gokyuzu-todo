import { useSyncExternalStore } from 'react'
import type { Undo } from '../data/store'

const VISIBLE_MS = 5_000

export interface PendingUndo {
  /** Bantta görünen metin, ör. "Silindi: Süt al". */
  label: string
  undo: Undo
}

let pending: PendingUndo | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function set(next: PendingUndo | null) {
  pending = next
  listeners.forEach((l) => l())
}

/** Bir kararı birkaç saniye geri alınabilir yapar; yeni karar öncekinin yerini alır. */
export async function offerUndo(label: string, action: Promise<Undo>): Promise<void> {
  // Bant, değişiklik veritabanına yansımadan önce açılır: ekranlar değişikliği gördüğünde
  // (ör. sabah kartı boşaldığında) geri alma hâlâ mümkün sayılsın.
  clearTimeout(timer)
  set({ label, undo: async () => (await action)() })
  timer = setTimeout(() => set(null), VISIBLE_MS)
  await action
}

export async function runUndo(): Promise<void> {
  const current = pending
  if (!current) return
  clearTimeout(timer)
  // Önce geri al, sonra bandı kapat: aradaki anda ekranlar geri alınmamış durumu "kesin" sanmasın.
  await current.undo()
  if (pending === current) set(null)
}

export function dismissUndo(): void {
  clearTimeout(timer)
  set(null)
}

export function usePendingUndo(): PendingUndo | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => pending,
  )
}
