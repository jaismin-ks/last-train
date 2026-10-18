import { useEffect, useState } from 'react'
import { useLoad } from '../systems/loadProgress'
import { useGame } from '../store'
import { startAmbience, unlockAudio } from '../audio/sounds'
import { goFullscreen } from '../systems/device'
import s from './screens.module.css'

/** If loading stalls (a file that never arrives), let them begin anyway after this long (seconds). */
const LOAD_PATIENCE = 25

/** Small headphones icon. */
function Headphones() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
      <rect x="2.5" y="14" width="5" height="7" rx="1.5" />
      <rect x="16.5" y="14" width="5" height="7" rx="1.5" />
    </svg>
  )
}

/**
 * The title and Begin, on one screen. The models, sky and phone screens start downloading as soon as the
 * page opens (while the warning and title are read); if they're still coming
 * in, Begin waits with a quiet percentage instead of dropping into a black screen.
 */
export function StartScreen() {
  const setPhase = useGame((st) => st.setPhase)
  const { active, progress } = useLoad()
  const [waitedEnough, setWaitedEnough] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setWaitedEnough(true), LOAD_PATIENCE * 1000)
    return () => clearTimeout(t)
  }, [])
  const ready = !active || progress >= 100 || waitedEnough
  const begin = () => {
    goFullscreen() // phones: fullscreen where the browser allows
    unlockAudio()
    startAmbience() // outside ambience runs from the start (this click also unlocks audio)
    setPhase('phoneIntro')
  }
  // Enter or Space works too, once it's ready
  useEffect(() => {
    if (!ready) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') begin()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className={s.screen}>
      <h1 className={s.title}>Last Train</h1>
      <p className={s.subtitle}>text me when you get home</p>
      <button
        className={s.begin}
        disabled={!ready}
        onClick={begin}
      >
        Begin
      </button>
      <p className={s.headphones} aria-live="polite">
        {ready ? (
          <>
            <Headphones /> Headphones recommended
          </>
        ) : (
          `Loading ${Math.floor(progress)}%`
        )}
      </p>
    </div>
  )
}
