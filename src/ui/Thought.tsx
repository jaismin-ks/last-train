import { useEffect, useState } from 'react'
import { THOUGHTS } from '../data/captions'
import { useGame } from '../store'

/** Inner-thought line in her voice: faint italic, fades in and out on its own. */
export function Thought() {
  const thought = useGame((s) => s.thought)
  const setThought = useGame((s) => s.setThought)
  const [shown, setShown] = useState<string | null>(null)

  useEffect(() => {
    if (!thought) return
    setShown(thought)
    const t = setTimeout(() => setThought(null), THOUGHTS.duration * 1000)
    return () => clearTimeout(t)
  }, [thought, setThought])

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: '24%',
        textAlign: 'center',
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
