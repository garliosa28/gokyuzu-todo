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

const CURSOR = 'syncCursor'

function strip<T>({ dirty: _, ...row }: Local<T>): T {
  return row as T
}

/** Yerel değişiklikleri gönderir, sonra sunucudaki yenilikleri çeker. Son yazan kazanır. */
export async function syncOnce(db: TodoDB, remote: Remote): Promise<void> {
  await push(db, remote)
  await pull(db, remote)
}

async function push(db: TodoDB, remote: Remote) {
  const lists = await db.lists.where('dirty').equals(1).toArray()
  const tasks = await db.tasks.where('dirty').equals(1).toArray()
  if (lists.length === 0 && tasks.length === 0) return

  await remote.push({ lists: lists.map(strip), tasks: tasks.map(strip) })

  // Gönderim sürerken yeniden düzenlenen satırlar kirli kalır, bir sonraki turda gider.
  await db.transaction('rw', db.lists, db.tasks, async () => {
    for (const sent of lists) {
      await db.lists.where('id').equals(sent.id).filter((l) => l.updated_at === sent.updated_at).modify({ dirty: 0 })
    }
    for (const sent of tasks) {
      await db.tasks.where('id').equals(sent.id).filter((t) => t.updated_at === sent.updated_at).modify({ dirty: 0 })
    }
  })
}

async function pull(db: TodoDB, remote: Remote) {
  const { lists, tasks, cursor } = await remote.pull(await getMeta(db, CURSOR))

  await db.transaction('rw', db.lists, db.tasks, db.meta, async () => {
    for (const incoming of lists) {
      const local = await db.lists.get(incoming.id)
      if (!local || incoming.updated_at > local.updated_at) await db.lists.put({ ...incoming, dirty: 0 })
    }
    for (const incoming of tasks) {
      const local = await db.tasks.get(incoming.id)
      if (!local || incoming.updated_at > local.updated_at) await db.tasks.put({ ...incoming, dirty: 0 })
    }
    if (cursor !== null) await setMeta(db, CURSOR, cursor)
  })
}
