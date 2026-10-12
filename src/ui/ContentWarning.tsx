import { useGame } from '../store'
import s from './screens.module.css'

export function ContentWarning() {
  const setPhase = useGame((st) => st.setPhase)
  return (
    <div className={s.screen}>
      <p className={s.label}>CONTENT WARNING</p>
      <p className={s.body}>
        This experience depicts fear, stalking and themes of sexual violence. No assault is shown.
      </p>
      <p className={s.small}>
        If you need support, resources are listed at the end and available at any time from the menu.
      </p>
      <button className={s.primary} onClick={() => setPhase('title')}>
        I understand — continue
      </button>
      <button className={s.link} onClick={() => setPhase('endCard')}>
        Skip to resources
      </button>
    </div>
  )
}
