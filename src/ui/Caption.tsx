import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { usePortrait } from '../systems/device'
import { useThumbsAtBottom } from './TouchControls'
import { PHONE_CLEAR } from './RitualOverlay'

/**
 * Instruction caption at the bottom of the screen, styled like film subtitles.
 * Cross-fades when the text changes.
 */
export function Caption() {
  const caption = useGame((s) => s.caption)
  const [shown, setShown] = useState(caption)
  const [visible, setVisible] = useState(!!caption)
  // held upright, the phone (during a ritual) covers the bottom: go above it
  const phoneUp = useGame((s) => s.ritual.phone !== null)
  const portrait = usePortrait()
  const overPhone = phoneUp && portrait
  const thumbs = useThumbsAtBottom()

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => {
      setShown(caption)
      setVisible(!!caption)
    }, 350)
    return () => clearTimeout(t)
  }, [caption?.text, caption?.sub]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: overPhone ? `calc(${PHONE_CLEAR}px + 3%)` : thumbs ? '30%' : '6%',
        padding: '0 max(24px, 12%)', // long announcements wrap instead of running edge to edge
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 6,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
        textShadow: '0 0 14px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.9)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(15px, 1.35vw, 19px)', color: 'var(--text)' }}>
        {shown?.text}
      </div>
      {shown?.sub && (
        <div style={{ marginTop: 6, fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
          {shown.sub}
        </div>
      )}
    </div>
  )
}
