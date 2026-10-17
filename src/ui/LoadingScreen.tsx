import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import s from './screens.module.css'

/** If a file never arrives, carry on anyway after this long (seconds). */
const PATIENCE = 40
/** Hold at 100% a moment so it doesn't flash past on a fast connection (seconds). */
const SETTLE = 0.6

/**
 * First thing on screen: the models, sky and phone screens download (they start
 * the moment the page opens), with a quiet bar and percentage. Then the game.
 */
export function LoadingScreen({ onReady }: { onReady: () => void }) {
  const { active, progress, total } = useProgress()
  const [waitedEnough, setWaitedEnough] = useState(false)
  const done = (total > 0 && !active && progress >= 100) || waitedEnough
  const shown = done ? 100 : Math.floor(progress)

  useEffect(() => {
    const t = setTimeout(() => setWaitedEnough(true), PATIENCE * 1000)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (!done) return
    const t = setTimeout(onReady, SETTLE * 1000)
    return () => clearTimeout(t)
  }, [done, onReady])

  return (
    <div className={s.screen} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={shown} aria-label="Loading">
      <p className={s.loadingTitle}>Last Train</p>
      <div className={s.loadingBar}>
        <div className={s.loadingFill} style={{ transform: `scaleX(${shown / 100})` }} />
      </div>
      <p className={s.loadingLabel}>{done ? 'Ready' : `Loading ${shown}%`}</p>
    </div>
  )
}
