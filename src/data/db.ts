import Dexie, { type EntityTable } from 'dexie'
import type { List, Local, Task } from './types'

export interface Meta {
  key: string
  value: string
}

export class TodoDB extends Dexie {
  lists!: EntityTable<Local<List>, 'id'>
  tasks!: EntityTable<Local<Task>, 'id'>
  meta!: EntityTable<Meta, 'key'>

  constructor(name = 'todo') {
    super(name)
    this.version(1).stores({
      lists: 'id, dirty',
      tasks: 'id, list_id, due_date, dirty',
      meta: 'key',
    })
  }
}

export async function getMeta(db: TodoDB, key: string): Promise<string | null> {
  return (await db.meta.get(key))?.value ?? null
}

export async function setMeta(db: TodoDB, key: string, value: string): Promise<void> {
  await db.meta.put({ key, value })
}
