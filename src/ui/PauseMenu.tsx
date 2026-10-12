import { useEffect, useState } from 'react'
import { Howler } from 'howler'
import { RESOURCES } from '../data/captions'
import { useGame } from '../store'
import { setFootsteps } from '../audio/sounds'

const PAUSABLE = ['phoneIntro', 'descent', 'street', 'platform']

/** Esc opens a pause menu: resume, volume, and support resources at any time. */
export function PauseMenu() {
  const phase = useGame((s) => s.phase)
  const paused = useGame((s) => s.paused)
  const setPaused = useGame((s) => s.setPaused)
  const [volume, setVolume] = useState(() => Howler.volume())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !PAUSABLE.includes(useGame.getState().phase)) return
      setPaused(!useGame.getState().paused)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPaused])

  useEffect(() => {
    if (paused) setFootsteps(0)
  }, [paused])

  if (!paused || !PAUSABLE.includes(phase)) return null

  const label: React.CSSProperties = { fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-dim)' }
  return (
    <div
      role="dialog"
      aria-label="Paused"
      onClick={() => setPaused(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        background: 'rgba(0, 0, 0, 0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(420px, 100%)', textAlign: 'center', display: 'grid', gap: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 48 }}>Paused</h2>

        <button
          onClick={() => setPaused(false)}
          style={{ ...label, color: 'var(--text)', padding: '14px 0', border: '1px solid rgba(232,236,233,0.5)', background: 'transparent' }}
        >
          Resume
        </button>

        <label style={{ display: 'grid', gap: 10 }}>
          <span style={label}>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value)
              setVolume(v)
              Howler.volume(v)
            }}
            style={{ accentColor: '#e8ece9' }}
          />
        </label>

        <div style={{ display: 'grid', gap: 12 }}>
          <span style={label}>If you need support</span>
          {RESOURCES.map((r) => (
            <div key={r.name}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{r.contact}</div>
            </div>
          ))}
        </div>

        <span style={{ ...label, fontSize: 10 }}>Esc to resume</span>
      </div>
    </div>
  )
}
