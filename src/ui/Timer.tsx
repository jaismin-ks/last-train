import { useGame } from '../store'
import { COUNTDOWN } from '../data/street'
import { goToResources } from './PauseMenu'
import s from './hud.module.css'

const clock = (t: number) => {
  const whole = Math.ceil(t)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/** "Station closes in 0:27": counts down at the top of the screen; red in the last seconds. */
export function Timer() {
  const countdown = useGame((st) => st.countdown)
  const paused = useGame((st) => st.paused)
  const label = useGame((st) => st.countdownLabel)
  if (countdown === null || paused) return null
  const warn = countdown <= COUNTDOWN.warnAt
  return (
    <div className={`${s.timer} ${warn ? s.timerWarn : ''}`} role="timer" aria-live="off">
      <span className={s.timerLabel}>{label}</span>
      <span className={s.timerClock}>{clock(countdown)}</span>
    </div>
  )
}

/**
 * Shown when the countdown runs out: you missed the last train. Try again restarts
 * this section, Restart goes back to the very beginning, or skip to resources.
 */
export function Missed() {
  const missed = useGame((st) => st.missed)
  const retry = useGame((st) => st.retry)
  const line = useGame((st) => st.missedLine)
  if (!missed) return null
  return (
    <div role="dialog" aria-modal aria-label="You missed the last train" className={s.missed}>
      <div className={s.panel}>
        <h2 className={s.heading}>You missed the last train.</h2>
        {line && <p className={s.warn}>{line}</p>}
        <div className={s.actions}>
          <button className={s.button} onClick={retry} autoFocus>
            Try again
          </button>
          <button className={`${s.button} ${s.quiet}`} onClick={() => location.assign(location.pathname)}>
            Restart from the beginning
          </button>
          <button className={`${s.button} ${s.quiet}`} onClick={goToResources}>
            Skip to resources
          </button>
        </div>
      </div>
    </div>
  )
}
