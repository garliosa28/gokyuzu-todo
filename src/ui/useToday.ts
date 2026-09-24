import { useEffect, useState } from 'react'
import { currentDayPart, toDateString } from '../data/today'
import type { DayPart } from '../data/types'

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

/** Şu anki günün bölümü (sabah / öğle / akşam); dakikada bir ve uygulamaya dönülünce güncellenir. */
export function useDayPart(): DayPart {
  const [part, setPart] = useState(() => currentDayPart(new Date()))
  useEffect(() => {
    const update = () => setPart(currentDayPart(new Date()))
    const timer = setInterval(update, 60_000)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return part
}
