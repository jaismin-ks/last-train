import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { isTouch } from '../systems/device'
import { useThumbsAtBottom } from './TouchControls'
import hud from './hud.module.css'

/**
 * Small interaction hint above the caption: a key chip and a quiet word,
 * e.g. "E|text Jess" shows [E] text Jess. On a phone it's a button instead
 * ("TEXT JESS") that presses the key. Fades in and out.
 */
export function Prompt() {
  const prompt = useGame((s) => s.prompt)
  // keep the last text while fading out, so it doesn't vanish mid-fade
  const [shown, setShown] = useState(prompt)
  const thumbs = useThumbsAtBottom()
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

  const button = isTouch && !!key
  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        // only as wide as the hint, so the thumbs around it still walk and look;
        // held upright the stick is under the right thumb, so the buttons go by the left one
        left: thumbs ? '7%' : '50%',
        transform: thumbs ? 'none' : 'translateX(-50%)',
        bottom: thumbs ? '17%' : '15%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
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
      {button ? (
        // only tappable while it's showing, not while it fades out
        <button className={hud.touchButton} onPointerDown={tap} style={{ pointerEvents: prompt ? 'auto' : 'none' }}>
          {label}
        </button>
      ) : key ? (
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
      ) : null}
      {!button && <span>{label}</span>}
    </div>
  )
}
