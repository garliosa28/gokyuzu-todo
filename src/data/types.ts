/** Tarihler yerel gün olarak 'YYYY-MM-DD'; zaman damgaları ISO 8601. */
export type DateString = string

/** Günün bölümü; null = gün içinde herhangi bir zaman. */
export type DayPart = 'morning' | 'afternoon' | 'evening'
export const DAY_PARTS: readonly DayPart[] = ['morning', 'afternoon', 'evening']

export interface List {
  id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Task {
  id: string
  list_id: string
  title: string
  done: boolean
  due_date: DateString | null
  day_part: DayPart | null
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** Yerelde saklanan satır: sunucuya henüz gönderilmemişse dirty = 1. */
export type Local<T> = T & { dirty: 0 | 1 }

export const INBOX_ID = 'inbox'
