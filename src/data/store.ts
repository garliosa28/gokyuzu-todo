import { getMeta, setMeta, type TodoDB } from './db'
import { INBOX_ID, type DateString, type List, type Local, type Task } from './types'

export type TaskPatch = Partial<Pick<Task, 'title' | 'list_id' | 'due_date'>>

export interface StoreOptions {
  now?: () => Date
}

export function createStore(db: TodoDB, { now = () => new Date() }: StoreOptions = {}) {
  const stamp = () => now().toISOString()

  async function patchTask(id: string, patch: Partial<Task>) {
    await db.tasks.update(id, { ...patch, updated_at: stamp(), dirty: 1 })
  }

  return {
    async addTask(title: string, opts: { listId?: string; dueDate?: DateString | null } = {}): Promise<Task> {
      if (!title.trim()) throw new Error('Görev başlığı boş olamaz')
      const ts = stamp()
      const task: Local<Task> = {
        id: crypto.randomUUID(),
        list_id: opts.listId ?? INBOX_ID,
        title: title.trim(),
        done: false,
        due_date: opts.dueDate ?? null,
        sort_order: now().getTime(),
        created_at: ts,
        updated_at: ts,
        deleted_at: null,
        dirty: 1,
      }
      await db.tasks.add(task)
      return task
    },

    async toggleTask(id: string): Promise<void> {
      const task = await db.tasks.get(id)
      if (task) await patchTask(id, { done: !task.done })
    },

    async updateTask(id: string, patch: TaskPatch): Promise<void> {
      if (patch.title !== undefined && !patch.title.trim()) throw new Error('Görev başlığı boş olamaz')
      await patchTask(id, patch.title !== undefined ? { ...patch, title: patch.title.trim() } : patch)
    },

    async deleteTask(id: string): Promise<void> {
      await patchTask(id, { deleted_at: stamp() })
    },

    /**
     * Gelen kutusu her cihazda aynı id ve sabit (en eski) zaman damgasıyla oluşturulur;
     * böylece iki cihazın ayrı ayrı oluşturması senkronda çakışma yaratmaz.
     */
    async ensureInbox(): Promise<void> {
      const epoch = new Date(0).toISOString()
      await db.transaction('rw', db.lists, async () => {
        if (await db.lists.get(INBOX_ID)) return
        await db.lists.add({
          id: INBOX_ID,
          name: 'Gelen Kutusu',
          sort_order: 0,
          created_at: epoch,
          updated_at: epoch,
          deleted_at: null,
          dirty: 1,
        })
      })
    },

    async addList(name: string): Promise<List> {
      if (!name.trim()) throw new Error('Liste adı boş olamaz')
      const ts = stamp()
      const list: Local<List> = {
        id: crypto.randomUUID(),
        name: name.trim(),
        sort_order: now().getTime(),
        created_at: ts,
        updated_at: ts,
        deleted_at: null,
        dirty: 1,
      }
      await db.lists.add(list)
      return list
    },

    async renameList(id: string, name: string): Promise<void> {
      if (!name.trim()) throw new Error('Liste adı boş olamaz')
      await db.lists.update(id, { name: name.trim(), updated_at: stamp(), dirty: 1 })
    },

    async deleteList(id: string): Promise<void> {
      if (id === INBOX_ID) throw new Error('Gelen kutusu silinemez')
      const ts = stamp()
      await db.transaction('rw', db.lists, db.tasks, async () => {
        await db.lists.update(id, { deleted_at: ts, updated_at: ts, dirty: 1 })
        await db.tasks
          .where('list_id')
          .equals(id)
          .filter((t) => !t.deleted_at)
          .modify({ deleted_at: ts, updated_at: ts, dirty: 1 })
      })
    },

    async lists(): Promise<List[]> {
      const rows = await db.lists.toArray()
      return rows.filter((l) => !l.deleted_at).sort((a, b) => a.sort_order - b.sort_order)
    },

    reviewedOn(): Promise<DateString | null> {
      return getMeta(db, 'reviewedOn')
    },

    markReviewed(day: DateString): Promise<void> {
      return setMeta(db, 'reviewedOn', day)
    },

    async allTasks(): Promise<Task[]> {
      return (await db.tasks.toArray()).filter((t) => !t.deleted_at)
    },

    async tasksInList(listId: string): Promise<Task[]> {
      const rows = await db.tasks.where('list_id').equals(listId).toArray()
      return rows.filter((t) => !t.deleted_at).sort((a, b) => a.sort_order - b.sort_order)
    },
  }
}

export type Store = ReturnType<typeof createStore>
