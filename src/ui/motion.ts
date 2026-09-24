/** Hareket sisteminin ortak dili ("Gökyüzü" brief'i, briefs/gokyuzu-hareket.md). */

/** Kendinden emin varış: hızlı başlar, yumuşak durur. */
export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'
/** Ağırlaşıp düşme: yavaş başlar, hızlanır. */
export const EASE_IN = 'cubic-bezier(0.55, 0, 0.9, 0.35)'

export function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Web Animations API ile oynatır; iptal edilse ya da desteklenmese de her zaman çözülür. */
export async function play(el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions): Promise<void> {
  if (typeof el.animate !== 'function') return
  try {
    await el.animate(keyframes, options).finished
  } catch {
    // Animasyon kesildi (ör. öğe kaldırıldı); sonuç yine de uygulanır.
  }
}

/** Hareketi azalt açıkken tüm çıkışların yerine geçen kısa soluklaşma. */
export function fadeOut(el: Element): Promise<void> {
  return play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'linear', fill: 'forwards' })
}

/** 0–1 arası kararlı bir sayı: aynı görev her cihazda gökyüzünde aynı yere düşsün. */
export function hash01(text: string, salt = 0): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10_000) / 10_000
}
