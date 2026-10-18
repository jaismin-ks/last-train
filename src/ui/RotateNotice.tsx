import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { isIOS, isStandalone, isTouch, portraitQuery } from '../systems/device'
import { IN_GAME } from './Hud'

/** Phones held upright: ask to turn sideways (the game pauses until they do). */
export function RotateNotice() {
  const [portrait, setPortrait] = useState(() => !!portraitQuery?.matches)
  useEffect(() => {
    const q = portraitQuery
    if (!q) return
    const on = () => setPortrait(q.matches)
    q.addEventListener('change', on)
    return () => q.removeEventListener('change', on)
  }, [])
  const show = isTouch && portrait
  useEffect(() => {
    const g = useGame.getState()
    if (show && IN_GAME.includes(g.phase) && !g.paused) g.setPaused(true)
  }, [show])
  if (!show) return null

  return (
    <div
      role="alertdialog"
      aria-label="Turn your phone sideways"
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 32 }}
    >
      <div style={{ display: 'grid', gap: 22, justifyItems: 'center' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden style={{ color: 'var(--text)', animation: 'turnPhone 2.4s ease-in-out infinite' }}>
          <rect x="7" y="2.5" width="10" height="19" rx="2" />
          <path d="M11 18.5h2" />
        </svg>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>Turn your phone sideways</p>
        <p style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Last Train plays in landscape</p>
        {isIOS && !isStandalone && (
          <p style={{ fontSize: 12, color: 'var(--text-dim)', maxWidth: 300, lineHeight: 1.6 }}>
            For full screen: tap Share, then Add to Home Screen, and open Last Train from there.
          </p>
        )}
      </div>
      <style>{'@keyframes turnPhone { 0%, 30% { transform: rotate(0deg) } 60%, 100% { transform: rotate(-90deg) } }'}</style>
    </div>
  )
}
