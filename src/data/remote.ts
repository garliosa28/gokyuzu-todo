import type { SupabaseClient } from '@supabase/supabase-js'
import type { Changes, Remote } from './sync'
import type { List, Task } from './types'

const PAGE = 1000
/**
 * synced_at yazma anında atanır ama işlem biraz sonra görünür olabilir.
 * İmleci biraz geriden alıp aynı satırları tekrar çekmek zararsızdır (birleştirme idempotent),
 * geç görünen bir satırı kaçırmak ise değildir.
 */
const OVERLAP_MS = 10_000

type Row<T> = T & { user_id?: string; synced_at: string }

function clean<T>({ user_id: _u, synced_at: _s, ...row }: Row<T>): T {
  return row as T
}

export function createSupabaseRemote(client: SupabaseClient): Remote {
  async function pullTable<T>(table: 'lists' | 'tasks', since: string | null) {
    const rows: Row<T>[] = []
    let from = since ? new Date(Date.parse(since) - OVERLAP_MS).toISOString() : null
    for (;;) {
      let query = client.from(table).select('*').order('synced_at').limit(PAGE)
      if (from) query = query.gt('synced_at', from)
      const { data, error } = await query
      if (error) throw error
      rows.push(...(data as Row<T>[]))
      if (data.length < PAGE) return rows
      from = (data[data.length - 1] as Row<T>).synced_at
    }
  }

  return {
    async push({ lists, tasks }: Changes) {
      if (lists.length) {
        const { error } = await client.from('lists').upsert(lists)
        if (error) throw error
      }
      if (tasks.length) {
        const { error } = await client.from('tasks').upsert(tasks)
        if (error) throw error
      }
    },

    async pull(since) {
      const [lists, tasks] = await Promise.all([pullTable<List>('lists', since), pullTable<Task>('tasks', since)])
      const latest = [...lists, ...tasks].reduce<string | null>(
        (max, r) => (max === null || Date.parse(r.synced_at) > Date.parse(max) ? r.synced_at : max),
        since,
      )
      return { lists: lists.map(clean), tasks: tasks.map(clean), cursor: latest }
    },
  }
}
