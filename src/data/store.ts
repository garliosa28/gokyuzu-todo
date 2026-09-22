import type { TodoDB } from './db'
import { INBOX_ID, type Local, type Task } from './types'

export interface StoreOptions {
  now?: () => Date
}

export function createStore(db: TodoDB, { now = () => new Date() }: StoreOptions = {}) {
  const stamp = () => now().toISOString()

  async function patchTask(id: string, patch: Partial<Task>) {
    await db.tasks.update(id, { ...patch, updated_at: stamp(), dirty: 1 })
  }

  return {
    async addTask(title: string): Promise<Task> {
      if (!title.trim()) throw new Error('Görev başlığı boş olamaz')
      const ts = stamp()
      const task: Local<Task> = {
        id: crypto.randomUUID(),
        list_id: INBOX_ID,
        title: title.trim(),
        done: false,
        due_date: null,
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

    async deleteTask(id: string): Promise<void> {
      await patchTask(id, { deleted_at: stamp() })
    },

    async tasksInList(listId: string): Promise<Task[]> {
      const rows = await db.tasks.where('list_id').equals(listId).toArray()
      return rows.filter((t) => !t.deleted_at).sort((a, b) => a.sort_order - b.sort_order)
    },
  }
}

export type Store = ReturnType<typeof createStore>
