import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { parseDateString } from '../data/today'
import { DAY_PARTS, type List, type Task } from '../data/types'
import { store } from './context'
import { flyToStar } from './flight'
import { DAY_PART_LABELS, dueLabel } from './format'
import { deleteWithUndo, moveToList, planForToday, postponeToTomorrow } from './taskActions'

/** Görevin gösterildiği yer: Bugün ekranında ertelenen görev ekrandan çıkar, liste ekranında taşınan. */
export type TaskContext = 'today' | 'list'

interface Props {
  task: Task
  today: string
  /** Ekranın bir kez sorguladığı listeler (her satır ayrıca sorgulamasın diye). */
  lists: List[]
  context: TaskContext
  showList?: boolean
  /** Bugün ekranı görevleri zaten bölüm başlıkları altında gösterir; orada tekrar yazılmaz. */
  showDayPart?: boolean
}

export function TaskItem({ task, today, lists, context, showList = false, showDayPart = true }: Props) {
  const [editing, setEditing] = useState(false)
  const row = useRef<HTMLLIElement>(null)
  const check = useRef<HTMLButtonElement>(null)
  const listName = lists.find((l) => l.id === task.list_id)?.name
  const overdue = !task.done && task.due_date !== null && task.due_date < today
  // Gecikmiş görev gün geçtikçe milimetrik sarkar: suçluluk değil, ağırlık hissi.
  const sag = overdue ? Math.min(6, daysBetween(task.due_date!, today)) : 0

  const meta = [
    task.due_date && task.due_date !== today ? dueLabel(task.due_date, today) : null,
    showList ? listName : null,
    showDayPart && task.day_part ? DAY_PART_LABELS[task.day_part] : null,
  ].filter(Boolean)

  function toggle() {
    const completing = !task.done
    store.toggleTask(task.id)
    // Tamamlanan görev hafifleyip yükselir ve Günün yayında yıldız olur.
    if (completing && context === 'today' && check.current) flyToStar(check.current, task.id)
  }

  return (
    <li
      ref={row}
      data-key={task.id}
      className={`task${task.done ? ' done' : ''}${sag ? ' sagging' : ''}`}
      style={sag ? ({ '--sag': sag } as CSSProperties) : undefined}
    >
      <div className="task-row">
        <button ref={check} className="check" aria-label={task.done ? 'Geri al' : 'Tamamla'} aria-pressed={task.done} onClick={toggle}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle className="check-ring" cx="12" cy="12" r="10" />
            <path className="check-mark" d="M7.2 12.6 L10.6 15.8 L17 8.6" pathLength={1} />
          </svg>
        </button>
        <button className="task-main" onClick={() => setEditing(!editing)} aria-expanded={editing}>
          <span className="title">
            {task.title}
            <svg className="ink" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
              <path d="M1 5 C 10 2.5, 20 6.5, 32 4.2 S 55 3, 68 4.8 S 88 6, 99 3.4" pathLength={1} />
            </svg>
          </span>
          {meta.length > 0 && <span className={`meta${overdue ? ' overdue' : ''}`}>{meta.join(' · ')}</span>}
        </button>
      </div>
      {editing && <TaskEditor task={task} today={today} lists={lists} context={context} row={row} />}
    </li>
  )
}

function daysBetween(from: string, to: string): number {
  return Math.round((parseDateString(to).getTime() - parseDateString(from).getTime()) / 86_400_000)
}

function TaskEditor({
  task,
  today,
  lists,
  context,
  row,
}: {
  task: Task
  today: string
  lists: List[]
  context: TaskContext
  row: RefObject<HTMLLIElement | null>
}) {
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
        {/* Bugün ekranında yarına ertelenen görev ekrandan ufka doğru çıkar; liste ekranında yerinde kalır. */}
        <button onClick={() => postponeToTomorrow(task, today, context === 'today' ? row.current : null)}>Yarın</button>
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
        <select
          aria-label="Liste"
          value={task.list_id}
          onChange={(e) => {
            const target = lists.find((l) => l.id === e.target.value)
            // Liste ekranında başka listeye taşınan görev yana kayarak çıkar; Bugün ekranında yerinde kalır.
            if (target) moveToList(task, target.id, target.name, context === 'list' ? row.current : null)
          }}
        >
          {!lists.some((l) => l.id === task.list_id) && <option value={task.list_id}>(liste henüz yüklenmedi)</option>}
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button className="danger" onClick={() => deleteWithUndo(task, row.current)}>
          Sil
        </button>
      </div>
    </div>
  )
}
