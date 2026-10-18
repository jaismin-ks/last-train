import { useGame } from '../store'
import s from './screens.module.css'

import { isIOS, isStandalone, isTouch } from '../systems/device'

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
      {isTouch && (
        <p className={s.small}>
          On a phone: hold it upright. Left thumb to walk (push all the way to run), drag anywhere else to look, and tap
          the prompts on screen.
          {isIOS && !isStandalone && ' For full screen on iPhone: tap Share, then Add to Home Screen, and open it from there.'}
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
