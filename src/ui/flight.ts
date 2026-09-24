import { EASE_OUT, play, reducedMotion } from './motion'

/** Uçuş süresi; yaydaki yeni yıldız bu kadar bekleyip belirir (styles.css: .star.arriving). */
export const FLIGHT_MS = 520

/**
 * Tamamlanan görev hafifleyip yükselir ve Günün yayında yıldız olur: işaret kutusundan yıldızın
 * yerine kavisli bir yolla uçan küçük bir ışık. Yay ekranda değilse (ör. liste ekranı) uçuş olmaz.
 */
export async function flyToStar(from: Element, taskId: string): Promise<void> {
  if (reducedMotion()) return
  const target = await waitFor(() => document.querySelector(`[data-star="${CSS.escape(taskId)}"]`))
  if (!target) return

  const a = from.getBoundingClientRect()
  const b = target.getBoundingClientRect()
  const start = { x: a.left + a.width / 2, y: a.top + a.height / 2 }
  const end = { x: b.left + b.width / 2, y: b.top + b.height / 2 }
  // Kavis: yol yukarı doğru hafifçe şişer, önce yükselip sonra yerine süzülür.
  const lift = Math.min(90, Math.abs(start.y - end.y) * 0.35 + 30)
  const mid = { x: start.x + (end.x - start.x) * 0.35, y: Math.min(start.y, end.y) - lift }

  const spark = document.createElement('div')
  spark.className = 'spark'
  document.body.append(spark)
  const at = (p: { x: number; y: number }, scale: number) => `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${scale})`
  await play(
    spark,
    [
      { transform: at(start, 0.6), opacity: 0 },
      { transform: at(start, 1.3), opacity: 1, offset: 0.12 },
      { transform: at(mid, 1), opacity: 1, offset: 0.55 },
      { transform: at(end, 0.5), opacity: 0.2 },
    ],
    { duration: FLIGHT_MS, easing: EASE_OUT },
  )
  spark.remove()
}

/** Bir sonraki birkaç karede öğenin DOM'a gelmesini bekler (React yıldızı henüz çizmemiş olabilir). */
async function waitFor<T>(find: () => T | null, frames = 12): Promise<T | null> {
  for (let i = 0; i < frames; i++) {
    const found = find()
    if (found) return found
    await new Promise((r) => requestAnimationFrame(r))
  }
  return null
}
