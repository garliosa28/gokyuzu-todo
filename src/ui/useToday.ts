import { useEffect, useState } from 'react'
import { toDateString } from '../data/today'

/** Bugünün tarihi; gece yarısı geçince ve uygulamaya dönülünce güncellenir. */
export function useToday(): string {
  const [today, setToday] = useState(() => toDateString(new Date()))
  useEffect(() => {
    const update = () => setToday(toDateString(new Date()))
    const timer = setInterval(update, 60_000)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return today
}
