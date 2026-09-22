import { liveQuery } from 'dexie'
import { useSyncExternalStore } from 'react'
import { createSupabaseRemote } from '../data/remote'
import { syncOnce } from '../data/sync'
import { db } from './context'
import { supabase } from './supabase'

export type SyncStatus = 'disabled' | 'signed-out' | 'offline' | 'syncing' | 'synced' | 'error'

export interface SyncState {
  status: SyncStatus
  email: string | null
  lastSyncedAt: Date | null
  error: string | null
}

const remote = supabase ? createSupabaseRemote(supabase) : null

const INTERVAL_MS = 60_000
const DEBOUNCE_MS = 1_500

let state: SyncState = {
  status: supabase ? 'signed-out' : 'disabled',
  email: null,
  lastSyncedAt: null,
  error: null,
}
const listeners = new Set<() => void>()

function set(patch: Partial<SyncState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

let running = false
let again = false
let debounce: ReturnType<typeof setTimeout> | undefined

/** Senkronu başlatır; zaten çalışıyorsa bittiğinde bir tur daha çalıştırır. */
export async function requestSync(): Promise<void> {
  if (!supabase || !state.email) return
  if (!navigator.onLine) return set({ status: 'offline' })
  if (running) {
    again = true
    return
  }
  running = true
  set({ status: 'syncing' })
  try {
    do {
      again = false
      await syncOnce(db, remote!)
    } while (again)
    set({ status: 'synced', lastSyncedAt: new Date(), error: null })
  } catch (e) {
    set({ status: navigator.onLine ? 'error' : 'offline', error: e instanceof Error ? e.message : String(e) })
  } finally {
    running = false
  }
}

export function startSync() {
  if (!supabase) return

  supabase.auth.onAuthStateChange((_event, session) => {
    const email = session?.user.email ?? null
    if (email === state.email) return
    set({ email, status: email ? state.status : 'signed-out' })
    // Geri çağrı içinde Supabase çağrısı yapmak kilitlenmeye yol açabilir; bir sonraki tura bırak.
    if (email) setTimeout(() => requestSync(), 0)
  })

  window.addEventListener('online', () => requestSync())
  window.addEventListener('offline', () => state.email && set({ status: 'offline' }))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestSync()
  })
  setInterval(() => requestSync(), INTERVAL_MS)

  // Yerel bir değişiklik olunca kısa bir beklemeyle gönder
  liveQuery(async () => (await db.lists.where('dirty').equals(1).count()) + (await db.tasks.where('dirty').equals(1).count())).subscribe(
    (pending) => {
      if (pending === 0) return
      clearTimeout(debounce)
      debounce = setTimeout(() => requestSync(), DEBOUNCE_MS)
    },
  )
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}
