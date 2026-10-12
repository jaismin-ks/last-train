import { useGame } from '../store'
import { startAmbience } from '../audio/sounds'
import s from './screens.module.css'

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

export function StartScreen() {
  const setPhase = useGame((st) => st.setPhase)
  return (
    <div className={s.screen}>
      <button
        className={s.begin}
        onClick={() => {
          startAmbience() // outside ambience runs from the start (this click also unlocks audio)
          setPhase('phoneIntro')
        }}
      >
        Begin
      </button>
      <p className={s.headphones}>
        <Headphones /> Headphones recommended
      </p>
    </div>
  )
}
