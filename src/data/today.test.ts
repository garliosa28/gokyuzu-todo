import { describe, expect, it } from 'vitest'
import { byDayPart, currentDayPart, morningReview, shouldCloseReview, todayView } from './today'
import type { Task } from './types'

let n = 0
function task(title: string, fields: Partial<Task> = {}): Task {
  return {
    id: String(n++),
    list_id: 'inbox',
    title,
    done: false,
    due_date: null,
    day_part: null,
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

  it('kart bugün gösterildi ve içindekiler tek tek halledildiyse gün kapanır', () => {
    const handled: Task[] = [] // hepsi Bugün/Ertele/Sil ile halledildi
    expect(shouldCloseReview(morningReview(handled, today, '2026-09-21'), today, '2026-09-21', today)).toBe(true)
  })

  it('ilk açılışta gözden geçirilecek bir şey yoksa gün kapanmaz; sonradan senkronla gelen kalanlar kartta görünür', () => {
    // Açılışta yerelde gecikmiş görev yok, kart hiç gösterilmedi
    expect(shouldCloseReview(morningReview([], today, '2026-09-21'), today, '2026-09-21', '2026-09-21')).toBe(false)
    // Sonra senkronla dünden kalan bir görev gelir: kart açılır
    expect(titles(morningReview(leftovers, today, '2026-09-21'))).toEqual(['Dün kalan'])
  })

  it('gözden geçirilecek görev varken ya da gün zaten kapalıyken tekrar kapatmaz', () => {
    expect(shouldCloseReview(morningReview(leftovers, today, '2026-09-21'), today, '2026-09-21', today)).toBe(false)
    expect(shouldCloseReview([], today, today, today)).toBe(false)
  })
})

describe('günün bölümleri', () => {
  it('görevleri sabah, öğle, akşam ve "gün içinde" olarak sırasını koruyarak ayırır', () => {
    const groups = byDayPart([
      task('Rapor', { day_part: 'afternoon' }),
      task('Koşu', { day_part: 'morning' }),
      task('Süt al'),
      task('Kitap', { day_part: 'evening' }),
      task('Toplantı', { day_part: 'afternoon' }),
    ])
    expect(titles(groups.morning)).toEqual(['Koşu'])
    expect(titles(groups.afternoon)).toEqual(['Rapor', 'Toplantı'])
    expect(titles(groups.evening)).toEqual(['Kitap'])
    expect(titles(groups.anytime)).toEqual(['Süt al'])
  })

  it('saate göre şu anki bölümü bilir (sabah 12.00, öğle 17.00 öncesi)', () => {
    const at = (h: number, m = 0) => currentDayPart(new Date(2026, 8, 22, h, m))
    expect([at(0), at(6), at(11, 59)]).toEqual(['morning', 'morning', 'morning'])
    expect([at(12), at(16, 59)]).toEqual(['afternoon', 'afternoon'])
    expect([at(17), at(23, 59)]).toEqual(['evening', 'evening'])
  })
})
