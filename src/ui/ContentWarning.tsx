import { useGame } from '../store'
import s from './screens.module.css'

/** Phones and tablets: no keyboard or mouse, so say so up front (they can still try). */
const touchOnly = typeof matchMedia !== 'undefined' && matchMedia('(hover: none) and (pointer: coarse)').matches

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
      {touchOnly && (
        <p className={s.small}>
          Last Train is made for a computer with a keyboard and mouse. On a phone or tablet it won’t play properly.
        </p>
      )}
      <button className={s.primary} onClick={() => setPhase('title')}>
        I understand — continue
      </button>
      <button className={s.link} onClick={() => setPhase('endCard')}>
        Skip to resources
      </button>
    </div>
  )
}
