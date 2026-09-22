import { useSyncState, type SyncStatus } from './syncController'

const labels: Record<SyncStatus, string> = {
  disabled: 'Yerel',
  'signed-out': 'Giriş yap',
  offline: 'Çevrimdışı',
  syncing: 'Senkronize ediliyor',
  synced: 'Güncel',
  error: 'Senkron hatası',
}

export function SyncBadge({ onClick }: { onClick: () => void }) {
  const { status } = useSyncState()
  return (
    <button className={`sync-badge ${status}`} onClick={onClick} aria-label={`Senkron durumu: ${labels[status]}`}>
      <span className="dot" />
      {labels[status]}
    </button>
  )
}
