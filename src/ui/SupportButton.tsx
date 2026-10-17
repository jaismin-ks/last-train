import { useEffect, useState } from 'react'
import { SUPPORT } from '../data/captions'
import { addSupport, hasPressed, isPending, supportCount } from '../systems/support'
import s from './support.module.css'

/** A big red button at the end of the resources: press it to show support; everyone who has, counted together. */
export function SupportButton() {
  const [pressed, setPressed] = useState(hasPressed)
  const [justPressed, setJustPressed] = useState(false) // pressed on this visit (the count we fetched doesn't include it yet)
  const [before, setBefore] = useState<number | null>(null) // the count as we found it
  const [total, setTotal] = useState<number | null>(null) // the count after our +1 got through (includes this person)

  useEffect(() => {
    // pressed last time but it never got through: send it now
    if (isPending()) addSupport().then((n) => n !== null && setTotal(n))
    else supportCount().then((n) => n !== null && setBefore(n))
  }, [])

  const press = async () => {
    if (pressed) return
    setPressed(true)
    setJustPressed(true)
    const n = await addSupport()
    if (n !== null) setTotal(n)
  }
  // what the button shows once pressed: the real total, or (while it's on its way) the count we found plus this press
  const count = total ?? (before === null ? null : before + (justPressed ? 1 : 0))

  return (
    <div className={s.support}>
      <p className={s.supportAsk}>{SUPPORT.ask}</p>
      {/* pressed: the button becomes the count (or keeps its words if the count can't be reached) */}
      <button className={`${s.supportButton} ${pressed ? s.supportPressed : ''}`} onClick={press} disabled={pressed} aria-pressed={pressed}>
        {pressed && count ? SUPPORT.pressed(count) : SUPPORT.button}
      </button>
      <p className={s.supportAfter} aria-live="polite">
        {pressed ? SUPPORT.after : ''}
      </p>
    </div>
  )
}
