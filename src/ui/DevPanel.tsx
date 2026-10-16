import { useState } from 'react'
import { useGame } from '../store'

/**
 * Testing only (never in the published build): a panel on the left to jump to
 * any scene. Each jump reloads the page at that point, so scenes start clean.
 */
const SCENES: { label: string; query: string }[] = [
  { label: 'Content warning', query: '' },
  { label: 'Title', query: 'phase=title' },
  { label: 'Begin screen', query: 'phase=start' },
  { label: 'Phone (texting Mom)', query: 'phase=phoneIntro' },
  { label: 'Descent from the sky', query: 'phase=descent' },
  { label: 'Street', query: 'phase=street' },
  { label: 'Station (walk down)', query: 'phase=platform' },
  { label: 'Platform (story)', query: 'phase=platform&skip=1' },
  { label: 'Train ride', query: 'phase=ride' },
  { label: 'Ending (text home, stats)', query: 'phase=epilogue' },
  { label: 'Resources', query: 'phase=endCard' },
  { label: 'Credits', query: 'phase=credits' },
]

const panel: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 40,
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'var(--font-ui)',
  fontSize: 11,
}
const list: React.CSSProperties = {
  display: 'grid',
  gap: 2,
  padding: 10,
  background: 'rgba(8, 10, 9, 0.92)',
  border: '1px solid rgba(232, 236, 233, 0.18)',
  borderLeft: 0,
  minWidth: 190,
}
const item: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  background: 'transparent',
  border: 0,
  color: 'var(--text)',
  fontSize: 11,
  letterSpacing: '0.04em',
}
const tab: React.CSSProperties = {
  writingMode: 'vertical-rl',
  padding: '10px 5px',
  background: 'rgba(8, 10, 9, 0.92)',
  border: '1px solid rgba(232, 236, 233, 0.18)',
  borderLeft: 0,
  color: 'var(--text-dim)',
  fontSize: 10,
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
}

export function DevPanel() {
  const [open, setOpen] = useState(false)
  const phase = useGame((s) => s.phase)
  const current = `phase=${phase}`
  const go = (query: string) => location.assign(location.pathname + (query ? `?${query}` : ''))
  const nextBeat = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN' }))

  return (
    <div style={panel}>
      {open && (
        <div style={list}>
          <div style={{ ...item, color: 'var(--text-dim)', letterSpacing: '0.25em', textTransform: 'uppercase', fontSize: 10 }}>
            Jump to scene
          </div>
          {SCENES.map((s) => {
            const here = s.query.split('&')[0] === current && (s.query.includes('skip') === location.search.includes('skip'))
            return (
              <button
                key={s.label}
                style={{ ...item, background: here ? 'rgba(232, 236, 233, 0.12)' : 'transparent' }}
                onClick={() => go(s.query)}
              >
                {s.label}
              </button>
            )
          })}
          <div style={{ height: 1, background: 'rgba(232, 236, 233, 0.12)', margin: '6px 0' }} />
          <button style={item} onClick={nextBeat} title="Same as pressing N">
            Skip to next story beat (N)
          </button>
          <button style={item} onClick={() => useGame.getState().setTrainDoorsOpen(!useGame.getState().trainDoorsOpen)} title="Same as pressing T">
            Toggle train doors (T)
          </button>
        </div>
      )}
      <button style={tab} onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Close' : 'Scenes'}
      </button>
    </div>
  )
}
