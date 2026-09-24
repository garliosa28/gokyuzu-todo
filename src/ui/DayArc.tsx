import { useEffect, useRef, useState } from 'react'
import type { DayPart, Task } from '../data/types'
import { arcPath, HORIZON, hourToT, moonPosition, PART_HOURS, pointOnArc, starPosition, sunPosition, VIEW } from './arc'
import { DAY_PART_LABELS } from './format'

const MILKY_WAY_AT = 30

/**
 * Günün yayı: gerçek saate göre ilerleyen güneş, sabah / öğle / akşam bölgeleri ve bugün biten
 * her görevin bıraktığı bir yıldız. Açık görev kalmayınca yıldızlar takımyıldıza bağlanır, güneş batar.
 */
export function DayArc({ tasks, nowPart }: { tasks: Task[]; nowPart: DayPart }) {
  const now = useMinute()
  const done = tasks.filter((t) => t.done)
  const open = tasks.length - done.length
  const night = done.length > 0 && open === 0
  const sun = sunPosition(now)
  // Gündüz güneş, gece (21.00–06.00) ay: ikisi de ufkun arkasından doğup batar.
  const moon = moonPosition(now)
  const elapsed = Math.min(1, Math.max(0, hourToT(now.getHours() + now.getMinutes() / 60)))

  // İlk çizimde var olan yıldızlar yerinde durur; sonradan gelenler uçan görevi bekleyip belirir.
  const known = useRef<Set<string> | null>(null)
  if (known.current === null) known.current = new Set(done.map((t) => t.id))
  const arriving = new Set(done.filter((t) => !known.current!.has(t.id)).map((t) => t.id))
  useEffect(() => {
    done.forEach((t) => known.current!.add(t.id))
  })

  const stars = done.map((t) => ({ id: t.id, ...starPosition(t) }))
  const constellation = [...stars].sort((a, b) => a.x - b.x)

  return (
    <figure className={`day-arc${night ? ' night' : ''}${moon.up ? ' nighttime' : ''}`} aria-label={arcLabel(open, done.length, night)}>
      <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} role="presentation">
        <defs>
          <radialGradient id="sun-glow">
            <stop offset="0" stopColor="var(--sun)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--sun)" stopOpacity="0" />
          </radialGradient>
          {/* Güneş ufkun arkasına gömülür: ufkun altı kırpılır. */}
          <clipPath id="above-horizon">
            <rect x="0" y="-40" width={VIEW.width} height={HORIZON + 40} />
          </clipPath>
          <radialGradient id="moon-glow">
            <stop offset="0" stopColor="var(--moon)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--moon)" stopOpacity="0" />
          </radialGradient>
          {/* Hilal: dolu diskten biraz kaydırılmış ikinci disk çıkarılır. */}
          <mask id="crescent">
            <circle r="6.5" fill="white" />
            <circle cx="3.2" cy="-2" r="5.6" fill="black" />
          </mask>
          <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--sky-night)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--sky-night)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gece yalnızca yayın kubbesinin içine iner. */}
        <path className="arc-dusk" d={`${arcPath()} Z`} fill="url(#dusk)" />
        <path className="arc-track" d={arcPath()} pathLength={1} />
        <path className="arc-elapsed" d={arcPath()} pathLength={1} strokeDasharray={`${elapsed} 1`} />
        {(['afternoon', 'evening'] as const).map((part) => {
          const p = pointOnArc(hourToT(PART_HOURS[part][0]))
          return <circle key={part} className="arc-tick" cx={p.x} cy={p.y} r={1.6} />
        })}
        <line className="arc-horizon" x1="8" x2={VIEW.width - 8} y1={HORIZON} y2={HORIZON} />

        {done.length > MILKY_WAY_AT && <path className="milky-way" d={arcPath(0.6)} />}
        <polyline
          className="constellation"
          points={constellation.map((s) => `${s.x},${s.y}`).join(' ')}
          pathLength={1}
        />
        {stars.map((s) => (
          <g key={s.id} data-star={s.id} transform={`translate(${s.x} ${s.y})`}>
            <path className={`star${arriving.has(s.id) ? ' arriving' : ''}`} d={starShape(s.size)} />
          </g>
        ))}

        <g clipPath="url(#above-horizon)">
          <g className="sun" style={{ transform: `translate(${sun.x}px, ${night || !sun.up ? HORIZON + 26 : sun.y}px)` }}>
            <circle r="16" fill="url(#sun-glow)" />
            <circle className="sun-disc" r="6.5" />
          </g>
          <g className="moon" style={{ transform: `translate(${moon.x}px, ${moon.up ? moon.y : HORIZON + 26}px)` }}>
            <circle r="15" fill="url(#moon-glow)" />
            <circle className="moon-disc" r="6.5" mask="url(#crescent)" transform="rotate(-20)" />
          </g>
        </g>

        {(['morning', 'afternoon', 'evening'] as const).map((part) => {
          const [from, to] = PART_HOURS[part]
          const x = pointOnArc(hourToT((from + to) / 2)).x
          return (
            <text key={part} className={`arc-part${part === nowPart ? ' now' : ''}`} x={x} y={HORIZON + 15} textAnchor="middle">
              {DAY_PART_LABELS[part]}
            </text>
          )
        })}
      </svg>
    </figure>
  )
}

/** Dört köşeli, ince bir yıldız. */
function starShape(r: number): string {
  const i = r * 0.32
  return `M 0 ${-r * 2} L ${i} ${-i} L ${r * 2} 0 L ${i} ${i} L 0 ${r * 2} L ${-i} ${i} L ${-r * 2} 0 L ${-i} ${-i} Z`
}

function arcLabel(open: number, done: number, night: boolean): string {
  if (night) return `Bugünün ${done} görevinin hepsi bitti`
  if (done === 0) return `Bugün ${open} görev var`
  return `Bugün ${done} görev bitti, ${open} görev kaldı`
}

/** Şu anki zaman; dakikada bir ve uygulamaya dönülünce güncellenir (güneş yay boyunca ilerlesin). */
function useMinute(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const update = () => setNow(new Date())
    const timer = setInterval(update, 60_000)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return now
}
