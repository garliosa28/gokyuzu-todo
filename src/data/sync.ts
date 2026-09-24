import type { Table } from 'dexie'
import { getMeta, setMeta, type TodoDB } from './db'
import type { List, Local, Task } from './types'

export interface Changes {
  lists: List[]
  tasks: Task[]
}

/** Sunucu tarafı. Gerçek uygulamada Supabase (remote.ts), testlerde bellekte bir sahte. */
export interface Remote {
  /** Sunucu, elindeki satırdan daha eski (updated_at) gelen satırları yok sayar. */
  push(changes: Changes): Promise<void>
  /** `since` imlecinden sonra sunucuya yazılmış satırlar ve yeni imleç. */
  pull(since: string | null): Promise<Changes & { cursor: string | null }>
}

/** Senkronlanan her tablo; yeni bir tablo eklemek için burası ve Changes yeterli. */
export const SYNCED_TABLES = ['lists', 'tasks'] as const satisfies readonly (keyof Changes)[]
type SyncedTable = (typeof SYNCED_TABLES)[number]
// Changes'e eklenip burada unutulan bir tablo derleme hatası verir (sessizce senkronlanmamak yerine).
const _allTablesSynced: [Exclude<keyof Changes, SyncedTable>] extends [never] ? true : never = true
void _allTablesSynced

type SyncedRow = { id: string; updated_at: string }

const CURSOR = 'syncCursor'
/** Yerel senkron durumunun (imleç, gönderildi işaretleri) ait olduğu sunucu + kullanıcı. */
const OWNER = 'syncOwner'

function withoutDirty<T>({ dirty: _, ...row }: Local<T>): T {
  return row as T
}

/** Tabloları ortak satır tipiyle döngüde işleyebilmek için. */
function table(db: TodoDB, name: SyncedTable): Table<Local<SyncedRow>, string> {
  return db[name] as unknown as Table<Local<SyncedRow>, string>
}

/** Sunucuya henüz gönderilmemiş satır sayısı. */
export async function pendingCount(db: TodoDB): Promise<number> {
  let count = 0
  for (const name of SYNCED_TABLES) count += await table(db, name).where('dirty').equals(1).count()
  return count
}

/**
 * Yerel değişiklikleri gönderir, sonra sunucudaki yenilikleri çeker. Son yazan kazanır.
 * owner: sunucuyu ve kullanıcıyı tanımlayan anahtar (ör. "proje-url|kullanıcı-id").
 */
export async function syncOnce(db: TodoDB, remote: Remote, owner: string): Promise<void> {
  await adopt(db, owner)
  await push(db, remote, owner)
  await pull(db, remote, owner)
}

/** Bu arada (ör. başka bir sekmede) başka bir sahip devraldıysa bu senkronun sonuçları yazılmaz. */
async function stillOwnedBy(db: TodoDB, owner: string): Promise<boolean> {
  return (await getMeta(db, OWNER)) === owner
}

/**
 * Başka bir sunucuya/hesaba geçildiyse eski imleç ve "gönderildi" işaretleri geçersizdir:
 * her şeyi yeniden gönderilecek olarak işaretle ve baştan çek.
 */
async function adopt(db: TodoDB, owner: string) {
  if ((await getMeta(db, OWNER)) === owner) return
  await db.transaction('rw', [...SYNCED_TABLES.map((name) => db[name]), db.meta], async () => {
    for (const name of SYNCED_TABLES) await table(db, name).toCollection().modify({ dirty: 1 })
    await db.meta.delete(CURSOR)
    await setMeta(db, OWNER, owner)
  })
}

async function push(db: TodoDB, remote: Remote, owner: string) {
  const sent = {} as Record<SyncedTable, Local<SyncedRow>[]>
  for (const name of SYNCED_TABLES) sent[name] = await table(db, name).where('dirty').equals(1).toArray()
  if (SYNCED_TABLES.every((name) => sent[name].length === 0)) return

  const changes = Object.fromEntries(SYNCED_TABLES.map((name) => [name, sent[name].map(withoutDirty)]))
  await remote.push(changes as unknown as Changes)

  // Gönderim sürerken yeniden düzenlenen satırlar kirli kalır, bir sonraki turda gider.
  await db.transaction('rw', [...SYNCED_TABLES.map((name) => db[name]), db.meta], async () => {
    if (!(await stillOwnedBy(db, owner))) return
    for (const name of SYNCED_TABLES) {
      for (const row of sent[name]) {
        await table(db, name)
          .where('id')
          .equals(row.id)
          .filter((current) => current.updated_at === row.updated_at)
          .modify({ dirty: 0 })
      }
    }
  })
}

async function pull(db: TodoDB, remote: Remote, owner: string) {
  const incoming = await remote.pull(await getMeta(db, CURSOR))

  await db.transaction('rw', [...SYNCED_TABLES.map((name) => db[name]), db.meta], async () => {
    if (!(await stillOwnedBy(db, owner))) return
    for (const name of SYNCED_TABLES) {
      for (const row of incoming[name] as SyncedRow[]) {
        const local = await table(db, name).get(row.id)
        // Eşitlikte sunucu kazanır: sunucu da eşit damgalı yazmayı kabul eder (schema.sql, lww_guard),
        // böylece aynı damgayla düzenleyen iki cihaz sunucunun sakladığı sürümde buluşur.
        if (!local || row.updated_at >= local.updated_at) await table(db, name).put({ ...row, dirty: 0 })
      }
    }
    if (incoming.cursor !== null) await setMeta(db, CURSOR, incoming.cursor)
  })
}
