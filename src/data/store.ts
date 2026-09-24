import { getMeta, setMeta, type TodoDB } from './db'
import { newId } from './id'
import { INBOX_ID, type DateString, type DayPart, type List, type Local, type Task } from './types'

export type TaskPatch = Partial<Pick<Task, 'title' | 'list_id' | 'due_date' | 'day_part'>>

/** Bir değişikliği geri alan işlem; geri alma da normal bir değişiklik gibi senkronlanır. */
export type Undo = () => Promise<void>

export interface StoreOptions {
  now?: () => Date
}

export function createStore(db: TodoDB, { now = () => new Date() }: StoreOptions = {}) {
  const stamp = () => now().toISOString()

  /**
   * Görünür görevler: silinmemiş ve listesi silinmemiş olanlar. Liste silme yazma anında görevlere
   * kaskad edilmez; böylece senkronla sonradan gelen görevler de listeyle birlikte gizli kalır.
   */
  async function visible(rows: Local<Task>[]): Promise<Task[]> {
    const deletedLists = new Set((await db.lists.toArray()).filter((l) => l.deleted_at).map((l) => l.id))
    return rows.filter((t) => !t.deleted_at && !deletedLists.has(t.list_id))
  }

  /**
   * Mevcut bir satırın yeni updated_at'i: şimdi, ama her zaman öncekinden en az 1 ms sonra.
   * Cihaz saati geride olsa bile yapılan son değişiklik "son yazan kazanır"da kazanır.
   */
  function nextStamp(previous: string): string {
    return new Date(Math.max(now().getTime(), Date.parse(previous) + 1)).toISOString()
  }

  /**
   * Satırı okuyup değiştirir; okuma ve yazma aynı transaction'da, böylece arada gelen yazma ezilmez.
   * Değişen alanların önceki değerlerini döndürür (geri alma için); değişiklik yapılmadıysa null.
   */
  async function patchTask(
    id: string,
    change: (task: Task, updated_at: string) => Partial<Task>,
    { includeDeleted = false } = {},
  ): Promise<Partial<Task> | null> {
    return db.transaction('rw', db.tasks, async () => {
      const task = await db.tasks.get(id)
      // Silinmiş göreve sonradan gelen düzenleme (ör. kapanan düzenleyicinin kaydı) yok sayılır.
      if (!task || (task.deleted_at && !includeDeleted)) return null
      const updated_at = nextStamp(task.updated_at)
      const patch = change(task, updated_at)
      await db.tasks.update(id, { ...patch, updated_at, dirty: 1 })
      return Object.fromEntries(Object.keys(patch).map((key) => [key, task[key as keyof Task]])) as Partial<Task>
    })
  }

  /** Önceki değerleri geri yazan bir Undo; silinmiş bir görevi geri getirmek de buna dahil. */
  function undoWith(id: string, previous: Partial<Task> | null): Undo {
    return async () => {
      if (previous) await patchTask(id, () => previous, { includeDeleted: true })
    }
  }

  async function patchList(id: string, change: (list: List, updated_at: string) => Partial<List>) {
    await db.transaction('rw', db.lists, async () => {
      const list = await db.lists.get(id)
      if (!list || list.deleted_at) return
      const updated_at = nextStamp(list.updated_at)
      await db.lists.update(id, { ...change(list, updated_at), updated_at, dirty: 1 })
    })
  }

  return {
    async addTask(title: string, opts: { listId?: string; dueDate?: DateString | null; dayPart?: DayPart | null } = {}): Promise<Task> {
      if (!title.trim()) throw new Error('Görev başlığı boş olamaz')
      const ts = stamp()
      const task: Local<Task> = {
        id: newId(),
        list_id: opts.listId ?? INBOX_ID,
        title: title.trim(),
        done: false,
        due_date: opts.dueDate ?? null,
        day_part: opts.dayPart ?? null,
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
      await patchTask(id, (task) => ({ done: !task.done }))
    },

    async updateTask(id: string, patch: TaskPatch): Promise<Undo> {
      if (patch.title !== undefined && !patch.title.trim()) throw new Error('Görev başlığı boş olamaz')
      const previous = await patchTask(id, () => (patch.title !== undefined ? { ...patch, title: patch.title.trim() } : patch))
      return undoWith(id, previous)
    },

    async deleteTask(id: string): Promise<Undo> {
      return undoWith(id, await patchTask(id, (_task, updated_at) => ({ deleted_at: updated_at })))
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
        id: newId(),
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
      await patchList(id, () => ({ name: name.trim() }))
    },

    async deleteList(id: string): Promise<void> {
      if (id === INBOX_ID) throw new Error('Gelen kutusu silinemez')
      await patchList(id, (_list, updated_at) => ({ deleted_at: updated_at }))
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

    /** Sabah kartının en son gösterildiği gün. */
    reviewShownOn(): Promise<DateString | null> {
      return getMeta(db, 'reviewShownOn')
    },

    markReviewShown(day: DateString): Promise<void> {
      return setMeta(db, 'reviewShownOn', day)
    },

    async allTasks(): Promise<Task[]> {
      return visible(await db.tasks.toArray())
    },

    async tasksInList(listId: string): Promise<Task[]> {
      const rows = await visible(await db.tasks.where('list_id').equals(listId).toArray())
      return rows.sort((a, b) => a.sort_order - b.sort_order)
    },
  }
}

export type Store = ReturnType<typeof createStore>
