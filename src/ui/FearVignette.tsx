import { useGame } from '../store'
import { FEAR } from '../data/fear'

/** Fear closes in from the edges of the screen; in a panic it pulses. */
export function FearVignette() {
  const stress = useGame((s) => s.stress)
  const panic = useGame((s) => s.panic)
  const k = panic ? 1 : stress
  if (k < 0.02) return null
  // the clear middle shrinks as fear rises
  const clear = 62 - 34 * k
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 4,
        background: `radial-gradient(ellipse at center, rgba(0,0,0,0) ${clear}%, rgba(0,0,0,${FEAR.vignette * k}) 100%)`,
        animation: panic ? 'fearPulse 0.9s ease-in-out infinite' : undefined,
      }}
    >
      <style>{'@keyframes fearPulse { 50% { opacity: 0.6 } }'}</style>
    </div>
  )
}
