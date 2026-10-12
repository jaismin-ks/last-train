import { useEffect } from 'react'
import { useGame } from '../store'
import s from './screens.module.css'

export function TitleCard() {
  const setPhase = useGame((st) => st.setPhase)
  const next = () => setPhase('start')

  // Any key works too
  useEffect(() => {
    const onKey = () => setPhase('start')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPhase])

  return (
    <div className={`${s.screen} ${s.clickable}`} onClick={next}>
      <h1 className={s.title}>Last Train</h1>
      <p className={s.subtitle}>text me when you get home</p>
      <p className={s.hint}>Click anywhere to continue</p>
    </div>
  )
}
