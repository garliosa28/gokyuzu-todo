import { liveQuery } from 'dexie'
import { useSyncExternalStore } from 'react'
import { createSupabaseRemote } from '../data/remote'
import { pendingCount, syncOnce } from '../data/sync'
import { db } from './context'
import { supabase, supabaseUrl } from './supabase'

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
/** Oturumdaki kullanıcı; yerel senkron durumu bu kullanıcıya ve projeye bağlanır. */
let userId: string | null = null
const listeners = new Set<() => void>()

function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

let running = false
let rerunRequested = false
let debounceTimer: ReturnType<typeof setTimeout> | undefined

/** Senkronu başlatır; zaten çalışıyorsa bittiğinde bir tur daha çalıştırır. */
export async function requestSync(): Promise<void> {
  if (!remote || !userId) return
  if (!navigator.onLine) return setState({ status: 'offline' })
  if (running) {
    rerunRequested = true
    return
  }
  const startedFor = userId
  running = true
  try {
    do {
      rerunRequested = false
      setState({ status: 'syncing' })
      await syncOnce(db, remote, `${supabaseUrl}|${startedFor}`)
    } while (rerunRequested && userId === startedFor)
    // Bu arada çıkış yapıldıysa ya da bağlantı gittiyse o durum geçerli kalır.
    if (userId !== startedFor) return
    setState(navigator.onLine ? { status: 'synced', lastSyncedAt: new Date(), error: null } : { status: 'offline' })
  } catch (e) {
    if (userId !== startedFor) return
    setState({ status: navigator.onLine ? 'error' : 'offline', error: e instanceof Error ? e.message : String(e) })
  } finally {
    running = false
    // Senkron sürerken başka bir hesaba geçildiyse onun için gelen istek burada çalışır.
    if (rerunRequested) {
      rerunRequested = false
      void requestSync()
    }
  }
}

export function startSync() {
  if (!supabase) return

  supabase.auth.onAuthStateChange((_event, session) => {
    const id = session?.user.id ?? null
    const email = session?.user.email ?? null
    if (id === userId) {
      if (email !== state.email) setState({ email }) // ör. aynı kullanıcının e-postası değişti
      return
    }
    userId = id
    if (!id) return setState({ email: null, status: 'signed-out' })
    setState({ email, status: navigator.onLine ? 'syncing' : 'offline' })
    // Geri çağrı içinde Supabase çağrısı yapmak kilitlenmeye yol açabilir; bir sonraki tura bırak.
    setTimeout(() => requestSync(), 0)
  })

  window.addEventListener('online', () => requestSync())
  window.addEventListener('offline', () => userId && setState({ status: 'offline' }))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestSync()
  })
  setInterval(() => requestSync(), INTERVAL_MS)

  // Yerel bir değişiklik olunca kısa bir beklemeyle gönder
  liveQuery(() => pendingCount(db)).subscribe((pending) => {
    if (pending === 0) return
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => requestSync(), DEBOUNCE_MS)
  })
}

/**
 * Yalnızca bu cihazdan çıkış yapar; diğer cihazlardaki oturumlar açık kalır.
 * scope 'local' ile oturum, sunucu isteği başarısız olsa bile (ör. çevrimdışı) yerelde silinir.
 */
export async function signOut(): Promise<void> {
  await supabase?.auth.signOut({ scope: 'local' })
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
