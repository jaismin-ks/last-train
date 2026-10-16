import { useEffect, useState } from 'react'
import { useGame } from '../store'

/** Sound captions, e.g. [heavy footsteps behind you], quiet and small, near the top. */
export function SoundCaption() {
  const text = useGame((s) => s.soundCaption)
  const [shown, setShown] = useState(text)
  useEffect(() => {
    if (text) setShown(text)
  }, [text])
  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: '14%',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 6,
        fontFamily: 'var(--font-ui)',
        fontSize: 12,
        letterSpacing: '0.08em',
        color: 'rgba(232, 236, 233, 0.7)',
        textShadow: '0 0 12px rgba(0,0,0,0.95)',
        opacity: text ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      {shown && `[${shown}]`}
    </div>
  )
}
