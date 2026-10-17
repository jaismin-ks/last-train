import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { isTouch } from '../systems/device'

/**
 * Small interaction hint above the caption: a key chip and a quiet word,
 * e.g. "E|text Jess" shows [E] text Jess. Fades in and out.
 */
export function Prompt() {
  const prompt = useGame((s) => s.prompt)
  // keep the last text while fading out, so it doesn't vanish mid-fade
  const [shown, setShown] = useState(prompt)
  useEffect(() => {
    if (prompt) setShown(prompt)
  }, [prompt])
  const [key, label] = (shown ?? '').includes('|') ? (shown ?? '').split('|') : ['', shown ?? '']

  // on a phone the hint is a button: tapping it presses its key
  const tap = () => {
    if (!key) return
    const code = `Key${key.toUpperCase()}`
    window.dispatchEvent(new KeyboardEvent('keydown', { code, key }))
    window.dispatchEvent(new KeyboardEvent('keyup', { code, key }))
  }

  return (
    <div
      aria-live="polite"
      onPointerDown={isTouch && prompt && key ? tap : undefined}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: '15%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        pointerEvents: isTouch && prompt && key ? 'auto' : 'none',
        zIndex: 5,
        color: 'rgba(230, 240, 235, 0.72)',
        fontFamily: 'var(--font-ui)',
        fontSize: 12,
        letterSpacing: '0.12em',
        textShadow: '0 0 12px rgba(0,0,0,0.9)',
        opacity: prompt ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
    >
      {key && (
        <kbd
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            minWidth: 22,
            padding: '3px 6px',
            textAlign: 'center',
            border: '1px solid rgba(230, 240, 235, 0.45)',
            borderRadius: 4,
            color: 'rgba(240, 245, 242, 0.9)',
            background: 'rgba(0, 0, 0, 0.35)',
          }}
        >
          {key}
        </kbd>
      )}
      <span>{label}</span>
    </div>
  )
}
