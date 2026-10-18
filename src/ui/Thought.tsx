import { useEffect, useState } from 'react'
import { THOUGHTS } from '../data/captions'
import { useGame } from '../store'
import { usePortrait } from '../systems/device'
import { useThumbsAtBottom } from './TouchControls'
import { PHONE_CLEAR } from './RitualOverlay'

/** Inner-thought line in her voice: faint italic, fades in and out on its own. */
export function Thought() {
  const thought = useGame((s) => s.thought)
  const setThought = useGame((s) => s.setThought)
  const phoneUp = useGame((s) => s.ritual.phone !== null) // the phone sits bottom-right: keep her lines clear of it
  const portrait = usePortrait() // held upright the phone fills the bottom, so her lines go above it
  const thumbs = useThumbsAtBottom()
  const [shown, setShown] = useState<string | null>(null)

  useEffect(() => {
    if (!thought) return
    setShown(thought)
    // short lines are read at a glance; longer ones stay a little longer
    const seconds = Math.min(5.5, Math.max(THOUGHTS.duration * 0.8, 1.6 + thought.length * 0.055))
    const t = setTimeout(() => setThought(null), seconds * 1000)
    return () => clearTimeout(t)
  }, [thought, setThought])

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: phoneUp && portrait ? `calc(${PHONE_CLEAR}px + 12%)` : thumbs ? '40%' : '24%',
        padding: portrait ? '0 8%' : phoneUp ? '0 calc(7% + 290px) 0 6%' : '0 18%',
        textAlign: 'center',
        lineHeight: 1.35,
        pointerEvents: 'none',
        zIndex: 6,
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 'clamp(16px, 1.5vw, 21px)',
        color: 'rgba(232, 236, 233, 0.7)',
        textShadow: '0 0 16px rgba(0,0,0,0.95)',
        opacity: thought ? 1 : 0,
        transition: 'opacity 1.2s ease',
      }}
    >
      {shown}
    </div>
  )
}
