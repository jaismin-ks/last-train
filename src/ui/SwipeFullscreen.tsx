import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store'
import { isIPhone, isStandalone, portraitQuery } from '../systems/device'
import { IN_GAME } from './Hud'

/**
 * iPhone Safari never lets a page go fullscreen, but it shrinks its toolbars when
 * the page is scrolled. So on iPhone the page is always a little taller than the
 * screen and scrollable behind the game (the game itself stays pinned to the
 * visible screen); while the bars are showing, held sideways, this asks for a
 * swipe up. The page is never locked again afterwards: that would scroll it back
 * to the top and Safari would bring its bars back. The game's own controls never
 * scroll the page. Shown again if the bars come back; the game pauses while it's up.
 */
const BARS_SHOWING = 40 // px: the view is at least this much shorter than the screen

/** The bars are taking up space (landscape: the screen's short side is its full height). */
function barsShowing() {
  const full = Math.min(screen.width, screen.height)
  return full - window.innerHeight > BARS_SHOWING
}

export function SwipeFullscreen() {
  const enabled = isIPhone && !isStandalone
  const [show, setShow] = useState(false)
  const pausedIt = useRef(false)

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('swipe-fullscreen') // for good, on iPhone
    const check = () => setShow(!portraitQuery?.matches && barsShowing())
    check()
    // the bars animate: look again once they've settled
    const later = () => setTimeout(check, 350)
    window.addEventListener('resize', later)
    window.addEventListener('scroll', later)
    portraitQuery?.addEventListener('change', later)
    return () => {
      window.removeEventListener('resize', later)
      window.removeEventListener('scroll', later)
      portraitQuery?.removeEventListener('change', later)
    }
  }, [enabled])

  // while it's up: a taller, scrollable page (that's what lets Safari tuck its bars away),
  // and the game waits; after, the page locks again and the game carries on
  useEffect(() => {
    if (!enabled) return
    if (show) {
      const g = useGame.getState()
      if (IN_GAME.includes(g.phase) && !g.paused) {
        g.setPaused(true)
        pausedIt.current = true
      }
    } else {
      // stay scrolled down, where the bars stay tucked away
      window.scrollTo(0, document.documentElement.scrollHeight)
      if (pausedIt.current) {
        pausedIt.current = false
        useGame.getState().setPaused(false)
      }
    }
  }, [show, enabled])

  if (!show) return null
  return (
    <div
      role="dialog"
      aria-label="Swipe up for full screen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99,
        background: '#000',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        touchAction: 'pan-y',
      }}
    >
      <div style={{ display: 'grid', gap: 18, justifyItems: 'center', pointerEvents: 'none' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden style={{ color: 'var(--text)', animation: 'swipeHint 1.6s ease-in-out infinite' }}>
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Swipe up for full screen</p>
        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
          or Share, then Add to Home Screen
        </p>
      </div>
      <style>{'@keyframes swipeHint { 0%, 100% { transform: translateY(8px); opacity: 0.4 } 50% { transform: translateY(-8px); opacity: 1 } }'}</style>
    </div>
  )
}
