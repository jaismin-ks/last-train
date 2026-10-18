import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store'
import { isTouch, usePortrait } from '../systems/device'

/**
 * Phones and tablets: a thumbstick bottom right (push to walk, all the way to run,
 * sideways to step) and drag anywhere else to look. They press the same keys and
 * move the same cursor the keyboard and mouse do, so the game itself doesn't change.
 */
const STICK = { radius: 56, deadZone: 0.35, side: 0.45, run: 0.92 }
// across / upDown: how far you drag (px) to look from the middle to the edge of the view;
// turnEdge: the cursor position (0–1 from the middle) where turning starts
const LOOK = { across: 185, upDown: 85, turnEdge: 0.6 }
/** Where the right thumb finds the stick: held upright it's the bottom of the screen. */
const STICK_AREA = {
  wide: { area: { width: '45%', height: '65%' }, rest: { right: '22%', bottom: '24%' } },
  tall: { area: { width: '50%', height: '45%' }, rest: { right: '20%', bottom: '16%' } },
}
/** The look hint goes once you've looked around (for the whole visit). */
let lookedAround = false
const WALK_PHASES = ['street', 'platform', 'ride']

/** Keep getting this finger's moves even if it slides off the pad (some browsers refuse; it still works without). */
const capture = (e: React.PointerEvent<HTMLElement>) => {
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch {
    // fine
  }
}

const press = (code: string, down: boolean) =>
  window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code }))

/** A phone held upright while walking: both thumbs sit along the bottom, so on-screen text moves up out of their way. */
export function useThumbsAtBottom() {
  const phase = useGame((s) => s.phase)
  return usePortrait() && isTouch && WALK_PHASES.includes(phase)
}

export function TouchControls() {
  const phase = useGame((s) => s.phase)
  const paused = useGame((s) => s.paused)
  const missed = useGame((s) => s.missed)
  const show = isTouch && WALK_PHASES.includes(phase) && !paused && !missed

  if (!show) return null
  return (
    <>
      <Stick />
      <LookPad />
    </>
  )
}

function Stick() {
  const fit = STICK_AREA[usePortrait() ? 'tall' : 'wide']
  const held = useRef<Record<string, boolean>>({})
  const [knob, setKnob] = useState<{ ox: number; oy: number; dx: number; dy: number } | null>(null)
  const id = useRef<number | null>(null)

  const setKeys = (want: Record<string, boolean>) => {
    for (const code of ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ShiftLeft']) {
      const on = !!want[code]
      if (on !== !!held.current[code]) press(code, on)
    }
    held.current = want
  }
  useEffect(() => () => setKeys({}), []) // let go of everything when it goes away

  const move = (x: number, y: number, ox: number, oy: number) => {
    let dx = (x - ox) / STICK.radius
    let dy = (y - oy) / STICK.radius
    const len = Math.hypot(dx, dy)
    if (len > 1) {
      dx /= len
      dy /= len
    }
    setKnob({ ox, oy, dx, dy })
    setKeys({
      KeyW: dy < -STICK.deadZone,
      KeyS: dy > STICK.deadZone,
      KeyA: dx < -STICK.side,
      KeyD: dx > STICK.side,
      ShiftLeft: dy < -STICK.run,
    })
  }

  return (
    <div
      style={{ position: 'fixed', right: 0, bottom: 0, ...fit.area, zIndex: 4, touchAction: 'none' }}
      onPointerDown={(e) => {
        id.current = e.pointerId
        capture(e)
        move(e.clientX, e.clientY, e.clientX, e.clientY)
      }}
      onPointerMove={(e) => knob && e.pointerId === id.current && move(e.clientX, e.clientY, knob.ox, knob.oy)}
      onPointerUp={() => {
        id.current = null
        setKnob(null)
        setKeys({})
      }}
      onPointerCancel={() => {
        id.current = null
        setKnob(null)
        setKeys({})
      }}
    >
      {/* resting hint, then the stick under your thumb */}
      {!knob && (
        <div style={{ position: 'absolute', ...fit.rest, width: 88, height: 88, borderRadius: '50%', border: '1px solid rgba(232,236,233,0.18)' }} />
      )}
      {knob && (
        <div style={{ position: 'fixed', left: knob.ox - STICK.radius, top: knob.oy - STICK.radius, width: STICK.radius * 2, height: STICK.radius * 2, borderRadius: '50%', border: '1px solid rgba(232,236,233,0.3)', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: STICK.radius + knob.dx * STICK.radius - 20, top: STICK.radius + knob.dy * STICK.radius - 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(232,236,233,0.28)' }} />
        </div>
      )}
    </div>
  )
}

function LookPad() {
  // a virtual cursor the drag moves: the game looks where it sits and turns near the edges
  const cursor = useRef({ x: innerWidth / 2, y: innerHeight / 2 })
  const last = useRef<{ x: number; y: number; id: number } | null>(null)
  const [hint, setHint] = useState(!lookedAround)
  const send = () => window.dispatchEvent(new MouseEvent('mousemove', { clientX: cursor.current.x, clientY: cursor.current.y }))
  useEffect(() => {
    send()
    return () => {
      cursor.current = { x: innerWidth / 2, y: innerHeight / 2 }
      send()
    }
  }, [])

  return (
    <>
      {/* until they've tried it: the other thumb looks around */}
      {hint && (
        <div style={{ position: 'fixed', left: '7%', bottom: '7%', maxWidth: '38%', zIndex: 3, pointerEvents: 'none', fontSize: 10, lineHeight: 1.6, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,236,233,0.45)', textShadow: '0 0 10px rgba(0,0,0,0.9)' }}>
          Drag with your other thumb to look around
        </div>
      )}
      <div
        // everywhere below the corner buttons; the stick sits on top of it
        style={{ position: 'fixed', left: 0, right: 0, top: '12%', bottom: 0, zIndex: 3, touchAction: 'none' }}
        onPointerDown={(e) => {
          last.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
          capture(e)
        }}
        onPointerMove={(e) => {
          const l = last.current
          if (!l || l.id !== e.pointerId) return
          const c = cursor.current
          // the same drag looks as far whichever way the phone is held
          c.x = Math.min(innerWidth - 1, Math.max(0, c.x + ((e.clientX - l.x) * innerWidth) / 2 / LOOK.across))
          c.y = Math.min(innerHeight - 1, Math.max(0, c.y + ((e.clientY - l.y) * innerHeight) / 2 / LOOK.upDown))
          l.x = e.clientX
          l.y = e.clientY
          send()
          if (!lookedAround) {
            lookedAround = true
            setTimeout(() => setHint(false), 1200) // let them see it worked first
          }
        }}
        onPointerUp={() => {
          last.current = null
          // let go: stop turning, but keep looking where you were
          const c = cursor.current
          const half = innerWidth / 2
          const off = (c.x - half) / half
          if (Math.abs(off) > LOOK.turnEdge * 0.95) c.x = half + Math.sign(off) * LOOK.turnEdge * 0.95 * half
          send()
        }}
        onPointerCancel={() => (last.current = null)}
      />
    </>
  )
}
