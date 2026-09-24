import type { SupabaseClient } from '@supabase/supabase-js'
import { SYNCED_TABLES, type Changes, type Remote } from './sync'

type SyncedTable = (typeof SYNCED_TABLES)[number]

/** Sunucudaki satır: yerel alanlara ek olarak sahibi ve sunucuya yazılma zamanı. */
export type ServerRow = { id: string; user_id?: string; synced_at: string } & Record<string, unknown>

/**
 * (synced_at, id) sıralamasında bir konum. id null ise "bu andan sonra" (o an hariç);
 * değilse "bu andaki bu id'den sonra" — aynı anda yazılmış satırlar sayfa sınırında kaybolmaz.
 */
export type Position = { synced_at: string; id: string | null }

/** Sunucu erişimi: yalnızca sayfa okuma ve toplu yazma. Gerçekte Supabase, testlerde bellek. */
export interface RowSource {
  /** `after`'dan sonraki satırlar, (synced_at, id) sırasıyla, en fazla `limit` tane. */
  fetchPage(table: SyncedTable, after: Position | null, limit: number): Promise<ServerRow[]>
  upsert(table: SyncedTable, rows: object[]): Promise<void>
}

const PAGE_SIZE = 1000
/** Tek bir upsert isteğindeki en fazla satır (ilk senkronda/sahip değişince her şey gönderilir). */
const PUSH_CHUNK = 500
/**
 * synced_at yazma anında atanır ama işlem biraz sonra görünür olabilir.
 * İmleci biraz geriden alıp aynı satırları tekrar çekmek zararsızdır (birleştirme idempotent),
 * geç görünen bir satırı kaçırmak ise değildir.
 */
const OVERLAP_MS = 10_000

function withoutServerFields({ user_id: _u, synced_at: _s, ...row }: ServerRow): object {
  return row
}

export function createRemote(source: RowSource): Remote {
  async function pullTable(table: SyncedTable, since: string | null): Promise<ServerRow[]> {
    const rows: ServerRow[] = []
    let after: Position | null = since ? { synced_at: new Date(Date.parse(since) - OVERLAP_MS).toISOString(), id: null } : null
    // Boş sayfa gelene kadar devam: sunucunun "Max rows" ayarı sayfayı istenenden küçük kırpabilir,
    // kısa sayfayı "son sayfa" saymak satır kaçırır.
    for (;;) {
      const page = await source.fetchPage(table, after, PAGE_SIZE)
      if (page.length === 0) return rows
      rows.push(...page)
      const last = page[page.length - 1]
      after = { synced_at: last.synced_at, id: last.id }
    }
  }

  return {
    async push(changes) {
      for (const table of SYNCED_TABLES) {
        for (let i = 0; i < changes[table].length; i += PUSH_CHUNK) {
          await source.upsert(table, changes[table].slice(i, i + PUSH_CHUNK))
        }
      }
    },

    async pull(since) {
      const pulled = await Promise.all(SYNCED_TABLES.map((table) => pullTable(table, since)))
      const cursor = pulled
        .flat()
        .reduce<string | null>((max, r) => (max === null || Date.parse(r.synced_at) > Date.parse(max) ? r.synced_at : max), since)
      const changes = Object.fromEntries(SYNCED_TABLES.map((table, i) => [table, pulled[i].map(withoutServerFields)]))
      return { ...(changes as unknown as Changes), cursor }
    },
  }
}

export function supabaseSource(client: SupabaseClient): RowSource {
  return {
    async fetchPage(table, after, limit) {
      let query = client.from(table).select('*').order('synced_at').order('id').limit(limit)
      if (after?.id === null) {
        query = query.gt('synced_at', after.synced_at)
      } else if (after) {
        // Nokta, iki nokta ve artı içeren değerler PostgREST'te çift tırnakla verilmeli.
        const t = `"${after.synced_at}"`
        query = query.or(`synced_at.gt.${t},and(synced_at.eq.${t},id.gt."${after.id}")`)
      }
      const { data, error } = await query
      if (error) throw error
      return data as ServerRow[]
    },

    async upsert(table, rows) {
      // Birincil anahtar (user_id, id); user_id gönderilmez, sunucuda auth.uid() ile dolar.
      const { error } = await client.from(table).upsert(rows, { onConflict: 'user_id,id' })
      if (error) throw error
    },
  }
}

export function createSupabaseRemote(client: SupabaseClient): Remote {
  return createRemote(supabaseSource(client))
}
