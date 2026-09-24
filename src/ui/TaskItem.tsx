import { useEffect, useRef, useState } from 'react'
import { DAY_PARTS, type List, type Task } from '../data/types'
import { store } from './context'
import { DAY_PART_LABELS, dueLabel } from './format'
import { deleteWithUndo, planForToday, postponeToTomorrow } from './taskActions'

interface Props {
  task: Task
  today: string
  /** Ekranın bir kez sorguladığı listeler (her satır ayrıca sorgulamasın diye). */
  lists: List[]
  showList?: boolean
  /** Bugün ekranı görevleri zaten bölüm başlıkları altında gösterir; orada tekrar yazılmaz. */
  showDayPart?: boolean
}

export function TaskItem({ task, today, lists, showList = false, showDayPart = true }: Props) {
  const [editing, setEditing] = useState(false)
  const listName = lists.find((l) => l.id === task.list_id)?.name
  const overdue = !task.done && task.due_date !== null && task.due_date < today

  const meta = [
    task.due_date && task.due_date !== today ? dueLabel(task.due_date, today) : null,
    showList ? listName : null,
    showDayPart && task.day_part ? DAY_PART_LABELS[task.day_part] : null,
  ].filter(Boolean)

  return (
    <li className={`task${task.done ? ' done' : ''}`}>
      <div className="task-row">
        <button className="check" aria-label={task.done ? 'Geri al' : 'Tamamla'} onClick={() => store.toggleTask(task.id)}>
          {task.done ? '✓' : ''}
        </button>
        <button className="task-main" onClick={() => setEditing(!editing)} aria-expanded={editing}>
          <span className="title">{task.title}</span>
          {meta.length > 0 && <span className={`meta${overdue ? ' overdue' : ''}`}>{meta.join(' · ')}</span>}
        </button>
      </div>
      {editing && <TaskEditor task={task} today={today} lists={lists} />}
    </li>
  )
}

function TaskEditor({ task, today, lists }: { task: Task; today: string; lists: List[] }) {
  const [title, setTitle] = useState(task.title)
  /** Sunucuda/yerelde kayıtlı son başlık (kırpılmış); taslak buna eşitse kaydedilecek bir şey yok. */
  const saved = useRef(task.title.trim())
  const draft = useRef(title)
  draft.current = title

  // Düzenleyici açıkken başlık başka bir cihazdan değişirse ve henüz yazmaya başlanmadıysa alanı güncelle;
  // yoksa eski metin, küçük bir düzenlemeyle uzaktaki değişikliğin üzerine yazılırdı.
  useEffect(() => {
    if (draft.current.trim() === saved.current && task.title.trim() !== saved.current) {
      saved.current = task.title.trim()
      setTitle(task.title)
    }
  }, [task.title])

  function saveTitle() {
    const next = draft.current.trim()
    if (!next || next === saved.current) return
    saved.current = next
    store.updateTask(task.id, { title: next })
  }

  // Düzenleyici hangi yolla kapanırsa kapansın (satıra dokunma, sekme değiştirme) başlık kaydedilir:
  // iOS Safari'de düğmeler odak almadığı için giriş alanının blur'u her zaman tetiklenmez.
  useEffect(() => saveTitle, [])

  return (
    <div className="editor">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          saveTitle()
          ;(e.currentTarget.elements.namedItem('title') as HTMLInputElement).blur()
        }}
      >
        <input name="title" value={title} aria-label="Başlık" enterKeyHint="done" onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle} />
      </form>
      <div className="chips">
        <button onClick={() => planForToday(task, today)}>Bugün</button>
        <button onClick={() => postponeToTomorrow(task, today)}>Yarın</button>
        <input
          type="date"
          aria-label="Son tarih"
          value={task.due_date ?? ''}
          onChange={(e) => store.updateTask(task.id, { due_date: e.target.value || null })}
        />
        {task.due_date && <button onClick={() => store.updateTask(task.id, { due_date: null })}>Tarihi kaldır</button>}
      </div>
      <div className="chips" role="group" aria-label="Günün bölümü">
        {DAY_PARTS.map((part) => (
          <button
            key={part}
            aria-pressed={task.day_part === part}
            className={task.day_part === part ? 'selected' : ''}
            // Seçili bölüme tekrar dokunmak seçimi kaldırır ("gün içinde").
            onClick={() => store.updateTask(task.id, { day_part: task.day_part === part ? null : part })}
          >
            {DAY_PART_LABELS[part]}
          </button>
        ))}
      </div>
      <div className="editor-row">
        <select aria-label="Liste" value={task.list_id} onChange={(e) => store.updateTask(task.id, { list_id: e.target.value })}>
          {!lists.some((l) => l.id === task.list_id) && <option value={task.list_id}>(liste henüz yüklenmedi)</option>}
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button className="danger" onClick={() => deleteWithUndo(task)}>
          Sil
        </button>
      </div>
    </div>
  )
}
