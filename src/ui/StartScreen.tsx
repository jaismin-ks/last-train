import { useGame } from '../store'
import s from './screens.module.css'

export function StartScreen() {
  const setPhase = useGame((st) => st.setPhase)
  return (
    <div className={s.screen}>
      <button className={s.begin} onClick={() => setPhase('phoneIntro')}>
        Begin
      </button>
      <p className={s.small}>Headphones recommended</p>
    </div>
  )
}
