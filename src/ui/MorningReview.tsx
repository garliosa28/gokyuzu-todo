import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Task } from '../data/types'
import { store } from './context'
import { dueLabel } from './format'
import { EASE_IN, fadeOut, play, reducedMotion } from './motion'
import { deleteWithUndo, planForToday, postponeToTomorrow } from './taskActions'

type Decision = 'today' | 'later' | 'delete'

/** Kartı karara göndermek için gereken en az sürükleme (px). */
const THRESHOLD = 88
/** Bu kadar sürüklenmeden yön ipucu gösterilmez; dokunuş titremesi karar sayılmaz. */
const DEAD_ZONE = 12
const VISIBLE_CARDS = 3

const HINTS: Record<Decision, string> = { today: 'Bugün', later: 'Ertele', delete: 'Sil' }

/**
 * Posta ayıklama: "Dünden kalanlar" bir deste kart. Üstteki kart sağa fırlatılınca Bugün'e alınır,
 * sola fırlatılınca yarına ertelenir, aşağı atılınca silinir. Düğmeler aynı kararları verir.
 */
export function MorningReview({ tasks, today }: { tasks: Task[]; today: string }) {
  const stack = tasks.slice(0, VISIBLE_CARDS)
  return (
    <section className="review" aria-label="Sabah gözden geçirmesi">
      <div className="review-head">
        <strong>
          Dünden kalanlar <span className="review-count">{tasks.length}</span>
        </strong>
        <button className="link" onClick={() => store.markReviewed(today)}>
          Sonra bakarım
        </button>
      </div>
      <div className="deck" data-cards={stack.length}>
        {[...stack].reverse().map((task) => {
          const depth = stack.indexOf(task)
          return depth === 0 ? (
            <TopCard key={task.id} task={task} today={today} />
          ) : (
            <div key={task.id} className="card" data-depth={depth} aria-hidden="true">
              <span className="card-title">{task.title}</span>
            </div>
          )
        })}
      </div>
      {stack[0] && <DecisionButtons task={stack[0]} today={today} />}
    </section>
  )
}

function TopCard({ task, today }: { task: Task; today: string }) {
  const card = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number; id: number } | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const lean = decisionFor(offset.x, offset.y, DEAD_ZONE)

  function onPointerDown(e: ReactPointerEvent) {
    if (e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
    card.current?.setPointerCapture(e.pointerId)
    setDragging(true)
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (start.current?.id !== e.pointerId) return
    // Yukarı sürükleme bir karar değil; kart yalnızca hafifçe direnir.
    const dy = e.clientY - start.current.y
    setOffset({ x: e.clientX - start.current.x, y: dy < 0 ? dy * 0.2 : dy })
  }

  function onPointerUp(e: ReactPointerEvent) {
    if (start.current?.id !== e.pointerId) return
    start.current = null
    setDragging(false)
    const decision = decisionFor(offset.x, offset.y, THRESHOLD)
    if (decision) decide(card.current, task, today, decision, offset)
    else setOffset({ x: 0, y: 0 }) // yayla yerine döner (CSS geçişi)
  }

  return (
    <div
      ref={card}
      className={`card top${dragging ? ' dragging' : ''}`}
      data-depth={0}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * 0.05}deg)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span className="card-title">{task.title}</span>
      <span className="card-meta">{dueLabel(task.due_date!, today)}</span>
      <span className={`card-hint${lean ? ` show hint-${lean}` : ''}`} aria-hidden="true">
        {lean ? HINTS[lean] : ''}
      </span>
    </div>
  )
}

function DecisionButtons({ task, today }: { task: Task; today: string }) {
  const card = () => document.querySelector<HTMLElement>('.deck .card.top')
  return (
    <div className="review-actions">
      <button onClick={() => decide(card(), task, today, 'later')}>Ertele</button>
      <button aria-label={`${task.title} görevini sil`} onClick={() => decide(card(), task, today, 'delete')}>
        Sil
      </button>
      <button onClick={() => decide(card(), task, today, 'today')}>Bugün</button>
    </div>
  )
}

function decisionFor(x: number, y: number, threshold: number): Decision | null {
  if (y > threshold && y > Math.abs(x)) return 'delete'
  if (x > threshold) return 'today'
  if (x < -threshold) return 'later'
  return null
}

const FLY_TO: Record<Decision, string> = {
  today: 'translate(140%, -12px) rotate(14deg)',
  later: 'translate(-140%, -12px) rotate(-14deg)',
  delete: 'translate(0, 180px) rotate(-6deg) scale(0.9)',
}

/** Kart karar yönüne doğru dönerek uçar, sonra karar yazılır (Geri al bandıyla). */
async function decide(
  el: HTMLElement | null,
  task: Task,
  today: string,
  decision: Decision,
  from: { x: number; y: number } = { x: 0, y: 0 },
) {
  if (el) {
    if (reducedMotion()) await fadeOut(el)
    else
      await play(
        el,
        [{ transform: `translate(${from.x}px, ${from.y}px) rotate(${from.x * 0.05}deg)` }, { transform: FLY_TO[decision], opacity: 0 }],
        { duration: 300, easing: EASE_IN, fill: 'forwards' },
      )
  }
  if (decision === 'today') await planForToday(task, today)
  else if (decision === 'later') await postponeToTomorrow(task, today)
  else await deleteWithUndo(task)
}
