import { useGame } from '../store'
import { RIDE_RITUALS } from '../data/ride'
import s from './ritual.module.css'
import hud from './hud.module.css'
import { isTouch } from '../systems/device'

/** How far up the screen the held phone reaches (px, with its put-away button), for text that must stay clear of it. */
export const PHONE_CLEAR = 365

/** On a phone there's no E: the button above the phone puts it away. */
const putAway = () => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e' }))
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', key: 'e' }))
}

/**
 * Train rituals on screen: the phone held up (a text that won't send, or a
 * call to no one). The keys ritual is sound and thought only.
 */
export function RitualOverlay() {
  const ritual = useGame((st) => st.ritual)
  const phase = useGame((st) => st.phase)
  const battery = useGame((st) => st.battery)
  if (phase !== 'ride') return null
  const phone = ritual.phone
  return (
    <>
      {phone && (
        <div className={s.phone} aria-live="polite">
          <div className={s.status}>
            <span>12:24</span>
            <span className={s.noService}>No Service</span>
            <span className={s.battery}>{battery}%</span>
          </div>
          {isTouch ? (
            <button className={`${hud.touchButton} ${s.putAwayButton}`} onPointerDown={putAway}>
              Put away
            </button>
          ) : (
            <div className={s.putAway}>E · put away</div>
          )}
          {phone.kind === 'text' ? (
            <div className={s.chat}>
              <div className={s.to}>Jess (roommate)</div>
              <div className={s.time}>{RIDE_RITUALS.text.earlier.time}</div>
              <div className={s.incoming}>{RIDE_RITUALS.text.earlier.text}</div>
              {phone.status !== '' && <div className={s.bubble}>{RIDE_RITUALS.text.message}</div>}
              {phone.status === 'failed' && <div className={s.failed}>! Not Delivered</div>}
              {phone.status === 'delivered' && <div className={s.delivered}>Delivered</div>}
              <div className={s.composer}>{phone.status === '' ? phone.typed : ''}</div>
            </div>
          ) : (
            <div className={s.call}>
              <div className={s.callName}>Mom</div>
              <div className={s.callState}>{phone.status === 'calling' ? 'calling…' : phone.status === 'talking' ? 'No Service' : 'Call Failed'}</div>
              <div className={s.hangup} />
            </div>
          )}
        </div>
      )}
    </>
  )
}
