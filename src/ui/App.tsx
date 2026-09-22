import { useEffect, useState } from 'react'
import { INBOX_ID } from '../data/types'
import { store } from './context'
import { ListScreen } from './ListScreen'
import { ListsScreen } from './ListsScreen'
import { TodayScreen } from './TodayScreen'

export type View = { kind: 'today' } | { kind: 'lists' } | { kind: 'list'; id: string }

export function App() {
  const [view, setView] = useState<View>({ kind: 'today' })

  useEffect(() => {
    store.ensureInbox()
  }, [])

  const tab = view.kind === 'list' && view.id === INBOX_ID ? 'inbox' : view.kind === 'list' ? 'lists' : view.kind

  return (
    <div className="app">
      {view.kind === 'today' && <TodayScreen />}
      {view.kind === 'lists' && <ListsScreen onOpen={(id) => setView({ kind: 'list', id })} />}
      {view.kind === 'list' && (
        <ListScreen
          listId={view.id}
          onBack={view.id === INBOX_ID ? undefined : () => setView({ kind: 'lists' })}
        />
      )}
      <nav className="tabbar">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setView({ kind: 'today' })}>
          Bugün
        </button>
        <button className={tab === 'inbox' ? 'active' : ''} onClick={() => setView({ kind: 'list', id: INBOX_ID })}>
          Gelen Kutusu
        </button>
        <button className={tab === 'lists' ? 'active' : ''} onClick={() => setView({ kind: 'lists' })}>
          Listeler
        </button>
      </nav>
    </div>
  )
}
