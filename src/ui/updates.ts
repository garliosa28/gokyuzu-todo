import { useSyncExternalStore } from 'react'
import { registerSW } from 'virtual:pwa-register'

let updateReady = false
let applyUpdate: () => Promise<void> = async () => {}
const listeners = new Set<() => void>()

/**
 * Yeni sürüm hazır olunca sayfa kendiliğinden yenilenmez (yazılmakta olan metin kaybolmasın);
 * kullanıcıya sorulur. Sorulmazsa yeni sürüm uygulama bir sonraki açılışta devreye girer.
 */
export function startUpdates() {
  const update = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateReady = true
      listeners.forEach((l) => l())
    },
  })
  applyUpdate = () => update(true)
}

export function reloadToUpdate() {
  return applyUpdate()
}

export function useUpdateReady(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => updateReady,
  )
}
