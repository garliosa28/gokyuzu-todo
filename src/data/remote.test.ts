import { describe, expect, it } from 'vitest'
import { createRemote, type Position, type RowSource, type ServerRow } from './remote'
import type { Task } from './types'

/**
 * PostgREST'in bellekteki karşılığı: satırlar (synced_at, id) sırasıyla döner,
 * `after`'dan sonrakiler (supabaseSource'taki or(...) filtresiyle aynı anlam), en fazla `limit` tane.
 */
function memorySource(
  rows: Record<'lists' | 'tasks', ServerRow[]>,
  { maxRows = Infinity } = {},
): RowSource & { upserts: { table: string; count: number }[] } {
  // Postgres sırası: önce zaman, sonra id; sıralama ve "sonrası" filtresi aynı karşılaştırmayı kullanır.
  const cmpId = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
  const byKey = (a: ServerRow, b: ServerRow) => Date.parse(a.synced_at) - Date.parse(b.synced_at) || cmpId(a.id, b.id)
  const isAfter = (r: ServerRow, after: Position) => {
    const dt = Date.parse(r.synced_at) - Date.parse(after.synced_at)
    return dt > 0 || (dt === 0 && after.id !== null && cmpId(r.id, after.id) > 0)
  }
  return {
    upserts: [],
    async fetchPage(table, after, limit) {
      return rows[table]
        .filter((r) => after === null || isAfter(r, after))
        .sort(byKey)
        .slice(0, Math.min(limit, maxRows)) // Supabase "Max rows" ayarı sayfayı sessizce kırpabilir
    },
    async upsert(table, batch) {
      this.upserts.push({ table, count: batch.length })
    },
  }
}

function taskRow(i: number, synced_at: string): ServerRow {
  const ts = '2026-09-01T00:00:00.000Z'
  const task: Task = {
    id: `t${String(i).padStart(5, '0')}`,
    list_id: 'inbox',
    title: `Görev ${i}`,
    done: false,
    due_date: null,
    sort_order: i,
    created_at: ts,
    updated_at: ts,
    deleted_at: null,
  }
  return { ...task, user_id: 'u1', synced_at }
}

const at = (seconds: number) => new Date(Date.parse('2026-09-22T08:00:00.000Z') + seconds * 1000).toISOString()

describe('Supabase uzak kaynağı', () => {
  it('aynı synced_at değerine sahip satırlar sayfa sınırına denk gelse de hepsi çekilir', async () => {
    // 1500 satır; 990-1010 arası aynı anda yazılmış (tek bir toplu upsert gibi)
    const tasks = Array.from({ length: 1500 }, (_, i) => taskRow(i, i >= 990 && i <= 1010 ? at(990) : at(i)))
    const remote = createRemote(memorySource({ lists: [], tasks }))

    const pulled = await remote.pull(null)

    expect(new Set(pulled.tasks.map((t) => t.id)).size).toBe(1500)
  })

  it('sunucuya özel alanlar (user_id, synced_at) yerel satırlara taşınmaz', async () => {
    const remote = createRemote(memorySource({ lists: [], tasks: [taskRow(1, at(1))] }))
    const { tasks } = await remote.pull(null)
    expect(Object.keys(tasks[0])).not.toContain('user_id')
    expect(Object.keys(tasks[0])).not.toContain('synced_at')
  })

  it('imleç en son yazılan satırın zamanıdır; sonraki çekme yalnızca o andan (10 sn örtüşmeyle) sonrakileri getirir', async () => {
    const tasks = [taskRow(1, at(0)), taskRow(2, at(100)), taskRow(3, at(200))]
    const source = memorySource({ lists: [], tasks })
    const remote = createRemote(source)

    const first = await remote.pull(null)
    expect(first.cursor).toBe(at(200))

    tasks.push(taskRow(4, at(195)), taskRow(5, at(300))) // 195: imleçten biraz önce görünür olmuş bir yazma
    const second = await remote.pull(first.cursor)
    expect(second.tasks.map((t) => t.id).sort()).toEqual(['t00003', 't00004', 't00005'])
    expect(second.cursor).toBe(at(300))
  })

  it('yeni satır yoksa imleç olduğu gibi kalır', async () => {
    const remote = createRemote(memorySource({ lists: [], tasks: [] }))
    expect((await remote.pull(at(50))).cursor).toBe(at(50))
  })

  it('sunucu sayfaları sessizce kırpsa da (Max rows ayarı) tüm satırlar çekilir', async () => {
    const tasks = Array.from({ length: 1500 }, (_, i) => taskRow(i, at(i)))
    const lists = [{ ...taskRow(9999, at(5000)), id: 'l1' }]
    const remote = createRemote(memorySource({ lists, tasks }, { maxRows: 300 }))
    const pulled = await remote.pull(null)
    expect(pulled.tasks.length).toBe(1500)
    expect(pulled.cursor).toBe(at(5000))
  })

  it('çok sayıda değişiklik parçalar halinde gönderilir', async () => {
    const source = memorySource({ lists: [], tasks: [] })
    const tasks = Array.from({ length: 1200 }, (_, i) => taskRow(i, at(i)) as unknown as Task)
    await createRemote(source).push({ lists: [], tasks })
    expect(source.upserts.every((u) => u.count <= 500)).toBe(true)
    expect(source.upserts.reduce((n, u) => n + u.count, 0)).toBe(1200)
  })
})
