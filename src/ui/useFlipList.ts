import { useLayoutEffect, useRef, type RefObject } from 'react'
import { play, reducedMotion } from './motion'

/** Hafif aşan (yaylı) varış: yerçekimi dünyasında bir nesnenin yerine oturması. */
const SETTLE = 'cubic-bezier(0.34, 1.32, 0.64, 1)'

/**
 * Listedeki satırlar (data-key taşıyan çocuklar) yer değiştirince eski yerlerinden yenisine kayar (FLIP);
 * listeye yeni katılan satır yukarıdan düşüp yerine oturur. Liste ilk çizildiğinde hareket yoktur.
 */
export function useFlipList(ref: RefObject<HTMLElement | null>): void {
  const tops = useRef<Map<string, number> | null>(null)

  useLayoutEffect(() => {
    const list = ref.current
    if (!list) return
    const rows = [...list.children].filter((el): el is HTMLElement => el instanceof HTMLElement && !!el.dataset.key)
    const next = new Map(rows.map((el) => [el.dataset.key!, el.offsetTop]))
    const prev = tops.current
    tops.current = next
    if (!prev) return

    const reduce = reducedMotion()
    for (const el of rows) {
      const before = prev.get(el.dataset.key!)
      const now = next.get(el.dataset.key!)!
      if (before === undefined) {
        if (reduce) play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 150 })
        else
          play(
            el,
            [
              { transform: 'translateY(-28px)', opacity: 0 },
              { transform: 'translateY(3px)', opacity: 1, offset: 0.7 },
              { transform: 'translateY(0)' },
            ],
            { duration: 420, easing: 'ease-out' },
          )
      } else if (before !== now && !reduce) {
        play(el, [{ transform: `translateY(${before - now}px)` }, { transform: 'translateY(0)' }], {
          duration: 380,
          easing: SETTLE,
        })
      }
    }
  })
}
