import { useGame } from '../store'
import { RIDE_RITUALS } from '../data/ride'
import s from './ritual.module.css'

/**
 * Train rituals on screen: the phone held up (a text that won't send, or a
 * call to no one), and your keys between your fingers once you've taken them out.
 */
export function RitualOverlay() {
  const ritual = useGame((st) => st.ritual)
  const phase = useGame((st) => st.phase)
  if (phase !== 'ride') return null
  const phone = ritual.phone
  return (
    <>
      {phone && (
        <div className={s.phone} aria-live="polite">
          <div className={s.status}>
            <span>12:24</span>
            <span className={s.noService}>No Service</span>
            <span className={s.battery}>3%</span>
          </div>
          {phone.kind === 'text' ? (
            <div className={s.chat}>
              <div className={s.to}>To: Jess</div>
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
      {ritual.keys && <Keys />}
    </>
  )
}

/** A fist with a key sticking out between two fingers, bottom right. */
function Keys() {
  return (
    <svg className={s.keys} viewBox="0 0 200 200" aria-hidden>
      {/* key blade between the fingers */}
      <path d="M96 40 L104 40 L106 96 L94 96 Z" fill="#9aa19d" />
      <path d="M98 44 L102 44 L102 50 L98 50 Z M98 56 L102 56 L102 60 L98 60 Z" fill="#6c726f" />
      {/* knuckles and fist */}
      <path
        d="M40 110 C40 92 56 86 66 92 C70 82 86 80 92 92 C96 84 112 84 116 94 C122 84 140 86 142 100 C152 96 164 104 160 122
           L156 170 C154 186 140 196 120 196 L80 196 C58 196 44 184 42 164 Z"
        fill="#0d0f0e"
        stroke="#262a28"
        strokeWidth="2"
      />
      <path d="M66 92 L68 120 M92 92 L92 120 M116 94 L114 120" stroke="#232725" strokeWidth="2" fill="none" />
      {/* key ring */}
      <circle cx="100" cy="150" r="14" fill="none" stroke="#9aa19d" strokeWidth="3" />
    </svg>
  )
}
