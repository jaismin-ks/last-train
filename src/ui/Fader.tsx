import { useGame } from '../store'

/** Full-screen black overlay for fades between scenes (driven by store.blackout). */
export function Fader() {
  const blackout = useGame((s) => s.blackout)
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        opacity: blackout,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  )
}
