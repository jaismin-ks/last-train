import { useGame } from '../store'

/**
 * Thin running-energy bar at the bottom of the screen. Hidden when full and
 * not running; turns red when nearly empty.
 */
export function StaminaBar() {
  const stamina = useGame((s) => s.stamina)
  const running = useGame((s) => s.running)
  const phase = useGame((s) => s.phase)
  const visible = (running || stamina < 0.99) && (phase === 'street' || phase === 'platform')
  const low = stamina < 0.25

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '2.6%',
        width: 'min(260px, 40vw)',
        height: 3,
        transform: 'translateX(-50%)',
        background: 'rgba(232, 236, 233, 0.12)',
        pointerEvents: 'none',
        zIndex: 6,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
    >
      <div
        style={{
          width: `${stamina * 100}%`,
          height: '100%',
          margin: '0 auto',
          background: low ? '#c8352d' : 'rgba(232, 236, 233, 0.75)',
          transition: 'background 0.4s ease',
        }}
      />
    </div>
  )
}
