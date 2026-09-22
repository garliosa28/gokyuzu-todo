import { useLiveQuery } from 'dexie-react-hooks'
import { INBOX_ID } from '../data/types'
import { store } from './context'
import { QuickAdd } from './QuickAdd'

export function ListsScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const lists = useLiveQuery(() => store.lists(), [])
  const tasks = useLiveQuery(() => store.allTasks(), [])
  const openCount = (id: string) => tasks?.filter((t) => t.list_id === id && !t.done).length ?? 0

  return (
    <>
      <header className="header">
        <h1>Listeler</h1>
      </header>
      <main className="content">
        <QuickAdd placeholder="Yeni liste…" onAdd={(name) => store.addList(name)} />
        <ul className="lists">
          {lists?.map((l) => (
            <li key={l.id}>
              <button className="list-open" onClick={() => onOpen(l.id)}>
                <span>{l.name}</span>
                <span className="count">{openCount(l.id) || ''}</span>
              </button>
              {l.id !== INBOX_ID && (
                <>
                  <button
                    className="icon small"
                    aria-label={`${l.name} listesini yeniden adlandır`}
                    onClick={() => {
                      const name = prompt('Yeni ad', l.name)
                      if (name?.trim()) store.renameList(l.id, name)
                    }}
                  >
                    ✎
                  </button>
                  <button
                    className="icon"
                    aria-label={`${l.name} listesini sil`}
                    onClick={() => {
                      if (confirm(`"${l.name}" ve içindeki görevler silinsin mi?`)) store.deleteList(l.id)
                    }}
                  >
                    ×
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
