import { useGame } from '../store'

/** Interaction hint at the bottom of the screen ("Press E to enter"). */
export function Prompt() {
  const prompt = useGame((s) => s.prompt)
  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: '16%',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 5,
        color: 'rgba(230, 240, 235, 0.85)',
        fontFamily: 'var(--font-ui)',
        fontSize: 13,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        textShadow: '0 0 12px rgba(0,0,0,0.9)',
        opacity: prompt ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      {prompt ?? ''}
    </div>
  )
}
