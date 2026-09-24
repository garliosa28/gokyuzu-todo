import type { DayPart, Task } from '../data/types'
import { hash01 } from './motion'

/** Yayın çizim alanı (SVG viewBox): ufuk çizgisi y = HORIZON, yay tepe noktası üstte. */
export const VIEW = { width: 360, height: 106 }
export const HORIZON = 86
const CENTER_X = 180
const RADIUS_X = 158
const RADIUS_Y = 72

/** Güneş 06.00'da doğar, 21.00'de batar; bölüm sınırları 12.00 ve 17.00. */
const SUNRISE = 6
const SUNSET = 21
export const PART_HOURS: Record<DayPart, [number, number]> = {
  morning: [SUNRISE, 12],
  afternoon: [12, 17],
  evening: [17, SUNSET],
}

/** Saat (ondalıklı) → yay üzerindeki açı parametresi, 0 = doğu ufku, 1 = batı ufku. */
export function hourToT(hour: number): number {
  return (hour - SUNRISE) / (SUNSET - SUNRISE)
}

/** Yay üzerindeki (ya da scale < 1 ise altındaki gökyüzündeki) nokta. */
export function pointOnArc(t: number, scale = 1): { x: number; y: number } {
  const angle = Math.PI * t
  return { x: CENTER_X - RADIUS_X * Math.cos(angle) * scale, y: HORIZON - RADIUS_Y * Math.sin(angle) * scale }
}

/** Yayın tamamı (scale = 1) ya da gökyüzünde daha aşağıdaki eş merkezli bir yay (samanyolu için). */
export function arcPath(scale = 1): string {
  const start = pointOnArc(0, scale)
  const end = pointOnArc(1, scale)
  return `M ${start.x} ${start.y} A ${RADIUS_X * scale} ${RADIUS_Y * scale} 0 0 1 ${end.x} ${end.y}`
}

export function sunPosition(now: Date): { x: number; y: number; up: boolean } {
  const hour = now.getHours() + now.getMinutes() / 60
  const t = hourToT(hour)
  const up = t >= 0 && t <= 1
  const p = pointOnArc(Math.min(1, Math.max(0, t)))
  return { ...p, up }
}

/**
 * Biten bir görevin yıldızı: kendi bölümünün gökyüzü diliminde, id'sinden türeyen kararlı bir yerde.
 * Bölümsüz görevler tüm gökyüzüne dağılır.
 */
export function starPosition(task: Pick<Task, 'id' | 'day_part'>): { x: number; y: number; size: number } {
  const [from, to] = task.day_part ? PART_HOURS[task.day_part] : [SUNRISE, SUNSET]
  const t = hourToT(from + (to - from) * (0.12 + 0.76 * hash01(task.id, 1)))
  const scale = 0.3 + 0.55 * hash01(task.id, 2)
  return { ...pointOnArc(t, scale), size: 1.1 + 1.1 * hash01(task.id, 3) }
}
