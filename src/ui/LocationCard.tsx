import { useEffect, useRef, useState } from 'react'
import { CAPTIONS } from '../data/captions'
import { useGame } from '../store'

/** "11:58 PM — Delmont St. W" chapter card, shown once when you land in the street. */
export function LocationCard() {
  const phase = useGame((s) => s.phase)
  const [visible, setVisible] = useState(false)
  const shown = useRef(false)

  useEffect(() => {
    if (phase !== 'street' || shown.current) return
    shown.current = true
    const on = setTimeout(() => setVisible(true), 600)
    const off = setTimeout(() => setVisible(false), 5200)
    return () => {
      clearTimeout(on)
      clearTimeout(off)
    }
  }, [phase])

  const { time, place } = CAPTIONS.street.location
  return (
    <div
      aria-hidden={!visible}
      style={{
        position: 'fixed',
        left: '6%',
        top: '9%',
        pointerEvents: 'none',
        zIndex: 6,
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.6s ease',
        textShadow: '0 0 14px rgba(0,0,0,0.95)',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: '0.35em', color: 'var(--text-dim)' }}>{time}</div>
      <div style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 2.2vw, 30px)', color: 'var(--text)' }}>
        {place}
      </div>
    </div>
  )
}
