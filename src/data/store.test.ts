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

describe('listeler', () => {
  it('gelen kutusu her zaman ilk listedir ve bir kez oluşturulur', async () => {
    await store.ensureInbox()
    await store.ensureInbox()
    await store.addList('İş')
    expect((await store.lists()).map((l) => l.name)).toEqual(['Gelen Kutusu', 'İş'])
  })

  it('liste yeniden adlandırılabilir', async () => {
    const list = await store.addList('İş')
    await store.renameList(list.id, 'Ofis')
    expect((await store.lists()).map((l) => l.name)).toEqual(['Ofis'])
  })

  it('görev doğrudan bir listeye eklenebilir ve başka listeye taşınabilir', async () => {
    const work = await store.addList('İş')
    const task = await store.addTask('Rapor yaz', { listId: work.id })
    expect((await store.tasksInList(work.id)).map((t) => t.title)).toEqual(['Rapor yaz'])

    await store.updateTask(task.id, { list_id: INBOX_ID })
    expect(await store.tasksInList(work.id)).toEqual([])
    expect((await store.tasksInList(INBOX_ID)).map((t) => t.title)).toEqual(['Rapor yaz'])
  })

  it('silinen liste ve içindeki görevler kaybolur', async () => {
    const work = await store.addList('İş')
    await store.addTask('Rapor yaz', { listId: work.id })
    await store.deleteList(work.id)
    expect(await store.lists()).toEqual([])
    expect(await store.tasksInList(work.id)).toEqual([])
  })

  it('gelen kutusu silinemez', async () => {
    await store.ensureInbox()
    await expect(store.deleteList(INBOX_ID)).rejects.toThrow()
    expect((await store.lists()).map((l) => l.id)).toEqual([INBOX_ID])
  })
})

describe('son tarih', () => {
  it('görev tarihle eklenebilir, tarihi değiştirilip kaldırılabilir', async () => {
    const task = await store.addTask('Fatura', { dueDate: '2026-09-22' })
    expect((await store.allTasks()).map((t) => t.due_date)).toEqual(['2026-09-22'])
    await store.updateTask(task.id, { due_date: '2026-09-25' })
    expect((await store.allTasks()).map((t) => t.due_date)).toEqual(['2026-09-25'])
    await store.updateTask(task.id, { due_date: null })
    expect((await store.allTasks()).map((t) => t.due_date)).toEqual([null])
  })
})

describe('sabah gözden geçirmesi', () => {
  it('gözden geçirilen gün kalıcı olarak hatırlanır', async () => {
    expect(await store.reviewedOn()).toBeNull()
    await store.markReviewed('2026-09-22')
    expect(await store.reviewedOn()).toBe('2026-09-22')
  })
})
