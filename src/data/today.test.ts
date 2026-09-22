import { describe, expect, it } from 'vitest'
import { morningReview, todayView } from './today'
import type { Task } from './types'

let n = 0
function task(title: string, fields: Partial<Task> = {}): Task {
  return {
    id: String(n++),
    list_id: 'inbox',
    title,
    done: false,
    due_date: null,
    sort_order: n,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    deleted_at: null,
    ...fields,
  }
}

const titles = (ts: Task[]) => ts.map((t) => t.title)

describe('Bugün görünümü', () => {
  const today = '2026-09-22'

  it('bugüne tarihli görevleri gösterir, tarihsiz ve gelecek tarihlileri göstermez', () => {
    const view = todayView(
      [task('Bugün', { due_date: today }), task('Tarihsiz'), task('Yarın', { due_date: '2026-09-23' })],
      today,
    )
    expect(titles(view.today)).toEqual(['Bugün'])
    expect(view.overdue).toEqual([])
  })

  it('tarihi geçmiş ve yapılmamış görevleri gecikmiş olarak ayırır', () => {
    const view = todayView(
      [
        task('Dün kalan', { due_date: '2026-09-21' }),
        task('Dün yapılan', { due_date: '2026-09-21', done: true }),
        task('Geçen ay', { due_date: '2026-08-15' }),
      ],
      today,
    )
    expect(titles(view.overdue)).toEqual(['Geçen ay', 'Dün kalan'])
    expect(view.today).toEqual([])
  })

  it('bugünün tamamlanmış görevleri yapılmamışların altında görünür', () => {
    const view = todayView(
      [task('Bitti', { due_date: today, done: true }), task('Açık', { due_date: today })],
      today,
    )
    expect(titles(view.today)).toEqual(['Açık', 'Bitti'])
  })

  it('silinmiş görevleri göstermez', () => {
    const view = todayView([task('Silindi', { due_date: today, deleted_at: '2026-09-22T09:00:00Z' })], today)
    expect(view.today).toEqual([])
  })
})

describe('sabah gözden geçirmesi', () => {
  const today = '2026-09-22'
  const leftovers = [
    task('Dün kalan', { due_date: '2026-09-21' }),
    task('Dün yapılan', { due_date: '2026-09-21', done: true }),
    task('Bugünkü', { due_date: today }),
  ]

  it('günün ilk açılışında önceki günlerden kalan yapılmamış görevleri sorar', () => {
    expect(titles(morningReview(leftovers, today, '2026-09-21'))).toEqual(['Dün kalan'])
  })

  it('daha önce hiç gözden geçirme yapılmadıysa da sorar', () => {
    expect(titles(morningReview(leftovers, today, null))).toEqual(['Dün kalan'])
  })

  it('bugün zaten gözden geçirildiyse bir daha sormaz', () => {
    expect(morningReview(leftovers, today, today)).toEqual([])
  })
})
