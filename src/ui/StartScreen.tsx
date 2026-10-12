import { useGame } from '../store'
import { startAmbience } from '../audio/sounds'
import s from './screens.module.css'

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
      <p className={s.small}>Headphones recommended</p>
    </div>
  )
}
