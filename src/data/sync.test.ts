import { beforeEach, describe, expect, it } from 'vitest'
import { TodoDB } from './db'
import { createStore } from './store'
import { syncOnce, type Changes, type Remote } from './sync'
import type { List, Task } from './types'

/**
 * Supabase'in bellekteki karşılığı: supabase/schema.sql'deki gibi,
 * gelen satır mevcut satırdan eskiyse (updated_at) yok sayılır;
 * her yazma artan bir senkron imleci alır.
 */
class FakeRemote implements Remote {
  lists = new Map<string, List & { seq: number }>()
  tasks = new Map<string, Task & { seq: number }>()
  seq = 0
  failNextPush = false
  /** Yarış durumlarını test etmek için: sunucu cevabı dönmeden hemen önce çalışır. */
  duringPush?: () => Promise<void>
  duringPull?: () => Promise<void>

  async push({ lists, tasks }: Changes) {
    if (this.failNextPush) {
      this.failNextPush = false
      throw new Error('ağ hatası')
    }
    const write = <T extends { id: string; updated_at: string }>(table: Map<string, T & { seq: number }>, row: T) => {
      const existing = table.get(row.id)
      if (existing && existing.updated_at > row.updated_at) return
      table.set(row.id, { ...row, seq: ++this.seq })
    }
    lists.forEach((l) => write(this.lists, l))
    tasks.forEach((t) => write(this.tasks, t))
    await this.duringPush?.()
  }

  async pull(since: string | null) {
    const after = since === null ? 0 : Number(since)
    await this.duringPull?.()
    const pick = <T extends { seq: number }>(table: Map<string, T>) =>
      [...table.values()].filter((r) => r.seq > after).map(({ seq: _, ...row }) => row)
    return { lists: pick(this.lists), tasks: pick(this.tasks), cursor: String(this.seq) }
  }
}

let n = 0
let remote: FakeRemote
let clock: number

function device() {
  const db = new TodoDB(`sync-${n++}`)
  const store = createStore(db, { now: () => new Date((clock += 1000)) })
  return { db, store, sync: () => syncOnce(db, remote) }
}

const titles = async (d: ReturnType<typeof device>) => (await d.store.allTasks()).map((t) => t.title).sort()

beforeEach(() => {
  remote = new FakeRemote()
  clock = Date.parse('2026-09-22T08:00:00Z')
})

describe('senkronizasyon', () => {
  it('bir cihazda eklenen görev diğer cihazda görünür', async () => {
    const phone = device()
    const laptop = device()
    await phone.store.addTask('Süt al')
    await phone.sync()
    await laptop.sync()
    expect(await titles(laptop)).toEqual(['Süt al'])
  })

  it('listeler ve silmeler de diğer cihaza geçer', async () => {
    const phone = device()
    const laptop = device()
    const work = await phone.store.addList('İş')
    const task = await phone.store.addTask('Rapor', { listId: work.id })
    await phone.store.addTask('Süt al')
    await phone.sync()
    await laptop.sync()
    expect((await laptop.store.lists()).map((l) => l.name)).toEqual(['İş'])

    await laptop.store.deleteTask(task.id)
    await laptop.sync()
    await phone.sync()
    expect(await titles(phone)).toEqual(['Süt al'])
  })

  it('iki cihaz aynı görevi değiştirirse son değişiklik kazanır (eski olan önce gönderilse de)', async () => {
    const phone = device()
    const laptop = device()
    const task = await phone.store.addTask('Süt al')
    await phone.sync()
    await laptop.sync()

    await phone.store.updateTask(task.id, { title: 'Süt al (eski)' })
    await laptop.store.updateTask(task.id, { title: 'Süt al (yeni)' })

    await phone.sync() // eski değişiklik önce sunucuya gider
    await laptop.sync() // yeni değişiklik, çekilen eskinin üzerine yazılmamalı
    await phone.sync()
    expect(await titles(phone)).toEqual(['Süt al (yeni)'])
    expect(await titles(laptop)).toEqual(['Süt al (yeni)'])
  })

  it('iki cihaz aynı görevi değiştirirse son değişiklik kazanır (yeni olan önce gönderilse de)', async () => {
    const phone = device()
    const laptop = device()
    const task = await phone.store.addTask('Süt al')
    await phone.sync()
    await laptop.sync()

    await phone.store.updateTask(task.id, { title: 'Süt al (eski)' })
    await laptop.store.updateTask(task.id, { title: 'Süt al (yeni)' })

    await laptop.sync()
    await phone.sync() // eski değişiklik sunucuda reddedilir, yeni olan çekilir
    await laptop.sync()
    expect(await titles(phone)).toEqual(['Süt al (yeni)'])
    expect(await titles(laptop)).toEqual(['Süt al (yeni)'])
  })

  it('gönderim başarısız olursa değişiklik kaybolmaz, sonraki senkronda gider', async () => {
    const phone = device()
    const laptop = device()
    await phone.store.addTask('Süt al')
    remote.failNextPush = true
    await expect(phone.sync()).rejects.toThrow()
    await phone.sync()
    await laptop.sync()
    expect(await titles(laptop)).toEqual(['Süt al'])
  })

  it('iki cihazda ayrı ayrı oluşan gelen kutusu tek liste olarak kalır', async () => {
    const phone = device()
    const laptop = device()
    await phone.store.ensureInbox()
    await laptop.store.ensureInbox()
    await phone.sync()
    await laptop.sync()
    await phone.sync()
    expect((await phone.store.lists()).map((l) => l.name)).toEqual(['Gelen Kutusu'])
    expect((await laptop.store.lists()).map((l) => l.name)).toEqual(['Gelen Kutusu'])
  })

  it('gönderim sürerken yapılan düzenleme de sonradan gönderilir', async () => {
    const phone = device()
    const laptop = device()
    const task = await phone.store.addTask('Süt al')
    remote.duringPush = async () => {
      remote.duringPush = undefined
      await phone.store.updateTask(task.id, { title: 'Yarım litre süt al' })
    }
    await phone.sync()
    await phone.sync()
    await laptop.sync()
    expect(await titles(laptop)).toEqual(['Yarım litre süt al'])
  })

  it('çekme sürerken yapılan düzenleme sunucudaki eski sürümle ezilmez', async () => {
    const phone = device()
    const task = await phone.store.addTask('Süt al')
    // İlk senkron: görev gönderilir, çekme adımı aynı görevin sunucu sürümünü geri getirir.
    remote.duringPull = async () => {
      remote.duringPull = undefined
      await phone.store.updateTask(task.id, { title: 'Yarım litre süt al' })
    }
    await phone.sync()
    expect(await titles(phone)).toEqual(['Yarım litre süt al'])
  })
})
