import { useEffect } from 'react'
import { useGame } from '../store'
import s from './screens.module.css'

export function TitleCard() {
  const setPhase = useGame((st) => st.setPhase)
  useEffect(() => {
    const t = setTimeout(() => setPhase('start'), 5000)
    return () => clearTimeout(t)
  }, [setPhase])

  return (
    <div className={s.screen}>
      <h1 className={s.title}>LAST TRAIN</h1>
      <p className={s.subtitle}>text me when you get home</p>
    </div>
  )
}
