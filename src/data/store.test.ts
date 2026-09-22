import { beforeEach, describe, expect, it } from 'vitest'
import { TodoDB } from './db'
import { createStore, type Store } from './store'
import { INBOX_ID } from './types'

let n = 0
let store: Store

beforeEach(() => {
  let t = Date.parse('2026-09-22T08:00:00Z')
  store = createStore(new TodoDB(`test-${n++}`), { now: () => new Date((t += 1000)) })
})

describe('görevler', () => {
  it('yeni görev gelen kutusuna eklenir', async () => {
    await store.addTask('Süt al')
    const tasks = await store.tasksInList(INBOX_ID)
    expect(tasks.map((t) => t.title)).toEqual(['Süt al'])
    expect(tasks[0].done).toBe(false)
  })

  it('görev tamamlanıp geri alınabilir', async () => {
    const task = await store.addTask('Süt al')
    await store.toggleTask(task.id)
    expect((await store.tasksInList(INBOX_ID))[0].done).toBe(true)
    await store.toggleTask(task.id)
    expect((await store.tasksInList(INBOX_ID))[0].done).toBe(false)
  })

  it('silinen görev listede görünmez', async () => {
    const a = await store.addTask('Süt al')
    await store.addTask('Ekmek al')
    await store.deleteTask(a.id)
    expect((await store.tasksInList(INBOX_ID)).map((t) => t.title)).toEqual(['Ekmek al'])
  })

  it('boş başlıklı görev eklenmez', async () => {
    await expect(store.addTask('   ')).rejects.toThrow()
    expect(await store.tasksInList(INBOX_ID)).toEqual([])
  })
})
