import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Dexie from 'dexie'
import { TodoDB } from './db'
import { createStore, type Store } from './store'
import { pendingCount } from './sync'
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

  describe('güvenli olmayan bağlantıda (http://192.168…, crypto.randomUUID yok)', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('görev ve liste yine eklenebilir, kimlikler benzersiz UUID olur', async () => {
      const { getRandomValues } = globalThis.crypto
      vi.stubGlobal('crypto', { getRandomValues: getRandomValues.bind(globalThis.crypto) })
      const a = await store.addTask('Süt al')
      const b = await store.addTask('Ekmek al')
      const list = await store.addList('İş')
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      expect([a.id, b.id, list.id].every((id) => uuid.test(id))).toBe(true)
      expect(new Set([a.id, b.id, list.id]).size).toBe(3)
    })
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

  it('silinmiş bir listeye sonradan gelen görev de görünmez', async () => {
    const work = await store.addList('İş')
    await store.deleteList(work.id)
    // ör. başka bir cihazdan senkronla gelen, silinen listeye ait görev
    await store.addTask('Rapor yaz', { listId: work.id })
    expect(await store.allTasks()).toEqual([])
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

  it('kartın gösterildiği gün kalıcı olarak hatırlanır', async () => {
    expect(await store.reviewShownOn()).toBeNull()
    await store.markReviewShown('2026-09-22')
    expect(await store.reviewShownOn()).toBe('2026-09-22')
  })
})

describe('zaman damgaları', () => {
  it('cihaz saati geri gitse bile bir satırın her değişikliği öncekinden daha yeni damga alır', async () => {
    let t = Date.parse('2026-09-22T12:00:00.000Z')
    const skewed = createStore(new TodoDB(`test-${n++}`), { now: () => new Date((t -= 60_000)) }) // her okumada 1 dk geri
    const stamps: string[] = []
    const stampOf = async () => stamps.push((await skewed.allTasks())[0].updated_at)

    const task = await skewed.addTask('Süt al')
    await stampOf()
    await skewed.updateTask(task.id, { title: 'Yarım litre süt al' })
    await stampOf()
    await skewed.toggleTask(task.id)
    await stampOf()
    await skewed.updateTask(task.id, { due_date: '2026-09-23' })
    await stampOf()

    expect(stamps.every((s, i) => i === 0 || s > stamps[i - 1])).toBe(true)
    const [saved] = await skewed.allTasks()
    expect([saved.title, saved.done, saved.due_date]).toEqual(['Yarım litre süt al', true, '2026-09-23'])
  })
})

describe('silinmiş görev', () => {
  it('silindikten sonra gelen düzenleme (ör. kapanan düzenleyicinin kaydı) gönderilecek bir değişiklik üretmez', async () => {
    const db = new TodoDB(`test-${n++}`)
    const local = createStore(db)
    const task = await local.addTask('Süt al')
    await local.deleteTask(task.id)
    await db.tasks.update(task.id, { dirty: 0 }) // silme gönderildi

    await local.updateTask(task.id, { title: 'Yarım litre süt al' })
    await local.toggleTask(task.id)

    expect(await pendingCount(db)).toBe(0)
    expect(await local.allTasks()).toEqual([])
  })
})

describe('günün bölümü', () => {
  it('görev bir bölümle eklenebilir, bölümü değiştirilip kaldırılabilir', async () => {
    const task = await store.addTask('Koşu', { dueDate: '2026-09-22', dayPart: 'morning' })
    expect((await store.allTasks())[0].day_part).toBe('morning')
    await store.updateTask(task.id, { day_part: 'evening' })
    expect((await store.allTasks())[0].day_part).toBe('evening')
    await store.updateTask(task.id, { day_part: null })
    expect((await store.allTasks())[0].day_part).toBeNull()
  })

  it('bölüm verilmeyen görev "gün içinde" sayılır', async () => {
    await store.addTask('Süt al')
    expect((await store.allTasks())[0].day_part).toBeNull()
  })

  it('alan eklenmeden önce kaydedilmiş görevler de bölümsüz okunur', async () => {
    const name = `eski-${n++}`
    const old = new Dexie(name)
    old.version(1).stores({ lists: 'id, dirty', tasks: 'id, list_id, due_date, dirty', meta: 'key' })
    await old.table('tasks').add({
      id: 't1', list_id: 'inbox', title: 'Eski görev', done: false, due_date: null, sort_order: 1,
      created_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-09-01T00:00:00.000Z', deleted_at: null, dirty: 0,
    })
    old.close()
    const upgraded = createStore(new TodoDB(name))
    expect((await upgraded.allTasks())[0].day_part).toBeNull()
  })
})

describe('geri al', () => {
  it('silinen görev geri alınabilir', async () => {
    const task = await store.addTask('Süt al')
    const undo = await store.deleteTask(task.id)
    expect(await store.allTasks()).toEqual([])
    await undo()
    expect((await store.allTasks()).map((t) => t.title)).toEqual(['Süt al'])
  })

  it('ertelenen görev geri alınınca eski tarihine döner', async () => {
    const task = await store.addTask('Fatura', { dueDate: '2026-09-21' })
    const undo = await store.updateTask(task.id, { due_date: '2026-09-23' })
    await undo()
    expect((await store.allTasks())[0].due_date).toBe('2026-09-21')
  })

  it('geri alma yalnızca kendi değiştirdiği alanı geri koyar', async () => {
    const task = await store.addTask('Fatura', { dueDate: '2026-09-21' })
    const undo = await store.updateTask(task.id, { due_date: '2026-09-23' })
    await store.updateTask(task.id, { title: 'Faturayı öde' })
    await undo()
    const [saved] = await store.allTasks()
    expect([saved.title, saved.due_date]).toEqual(['Faturayı öde', '2026-09-21'])
  })
})
