import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useTexture } from '@react-three/drei'
import { editable as e } from '@theatre/r3f'
import { MathUtils, SRGBColorSpace } from 'three'
import {
  inHotspot,
  phoneScreenUrl,
  phoneSteps,
  SWIPE_DISTANCE,
} from '../data/phoneScreens'
import { Phone, type ScreenPointer } from '../components/Phone'
import { createTypingScreen } from '../components/typingScreen'
import { useGame } from '../store'
import { DESCENT } from '../data/street'

/** The phone sits this far in front of the camera at this field of view. */
const PHONE_DISTANCE = 0.32
const PHONE_FOV = 35

/** Per-letter timestamps (seconds) with a little human jitter and pauses after spaces. */
function typingSchedule(text: string, cps: number) {
  const times: number[] = []
  let t = 0.25
  for (const ch of [...text]) {
    times.push(t)
    t += (1 / cps) * (0.6 + Math.random() * 0.8) + (ch === ' ' ? 0.12 : 0)
  }
  return { times, end: t + 0.35 }
}

/**
 * Interactive phone cutscene: swipe up to unlock, tap the field and watch
 * the message type out (drawn live), tap send, close the battery alert.
 * Steps and hotspots live in data/phoneScreens.ts.
 * Animate the phone and light in Theatre.js ("Phone" and "Phone Light").
 */
export function PhoneIntro() {
  const urls = useMemo(() => phoneSteps.map((s) => phoneScreenUrl(s.file)), [])
  const textures = useTexture(urls)
  textures.forEach((t) => (t.colorSpace = SRGBColorSpace))

  const setPhase = useGame((s) => s.setPhase)
  const phase = useGame((s) => s.phase)
  const [opacity, setOpacity] = useState(1)
  const [index, setIndex] = useState(0)
  const endStart = useRef<number | null>(null)
  const skipped = useRef(false)
  const follow = useRef<Group>(null)
  // idle → typing (letters appear) → typed (full message + send button, waiting for a tap)
  const [typing, setTyping] = useState<'idle' | 'typing' | 'typed'>('idle')
  const swipeStart = useRef<number | null>(null)
  const step = phoneSteps[index]

  const typingScreen = useMemo(createTypingScreen, [])
  useEffect(() => typingScreen.dispose, [typingScreen])
  const typingRun = useRef<{ start: number; times: number[]; end: number } | null>(null)

  const next = () => {
    setTyping('idle')
    if (index < phoneSteps.length - 1) setIndex(index + 1)

  }

  // Auto-advancing steps
  useEffect(() => {
    if (step.advance.type !== 'auto') return
    const t = setTimeout(next, step.advance.after * 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // Typing animation, redrawn every frame while it runs
  useFrame(({ clock, camera }) => {
    // Keep the phone in front of the camera, even while the descent moves it.
    // Distance scales with the field of view so the phone stays the same size on screen.
    if (follow.current) {
      const fov = (camera as { fov?: number }).fov ?? PHONE_FOV
      const d = PHONE_DISTANCE * Math.tan(MathUtils.degToRad(PHONE_FOV / 2)) / Math.tan(MathUtils.degToRad(fov / 2))
      follow.current.position.copy(camera.position)
      follow.current.quaternion.copy(camera.quaternion)
      follow.current.translateZ(-d)
    }

    const a = step.advance

    // Last screen: hold (or skip), fade the phone to black, then start the descent
    if (a.type === 'end') {
      if (endStart.current === null) endStart.current = clock.elapsedTime
      if (skipped.current) {
        endStart.current = clock.elapsedTime - a.hold
        skipped.current = false
      }
      const t = clock.elapsedTime - endStart.current - a.hold
      if (t > 0) setOpacity(Math.max(0, 1 - t / DESCENT.phoneFade))
      if (phase === 'phoneIntro' && t >= DESCENT.phoneFade) setPhase('descent')
      return
    }

    if (typing === 'idle' || a.type !== 'tapThenType') return
    const now = clock.elapsedTime
    if (!typingRun.current) typingRun.current = { start: now, ...typingSchedule(a.text, a.charsPerSecond) }
    const run = typingRun.current
    const t = now - run.start

    const chars = [...a.text] // by character, so emoji stay whole
    const count = run.times.filter((time) => time <= t).length
    const lastTime = run.times[count - 1] ?? -1
    const pressed = count > 0 && t - lastTime < 0.12 ? chars[count - 1] : null
    const caretOn = count < chars.length || Math.floor(t * 2) % 2 === 0

    typingScreen.draw(textures[index].image as CanvasImageSource, chars.slice(0, count).join(''), pressed, caretOn)

    // Finished typing: keep this screen (caret still blinking) until send is tapped
    if (typing === 'typing' && t >= run.end) setTyping('typed')
  })

  const interactive = typing !== 'typing'
  const onMove = (p: ScreenPointer) => {
    const a = step.advance
    const overHotspot =
      (a.type === 'tap' && inHotspot(p, a.hotspot)) ||
      (a.type === 'end' && !!a.skip && inHotspot(p, a.skip)) ||
      (a.type === 'tapThenType' && inHotspot(p, typing === 'typed' ? a.send : a.hotspot))
    document.body.style.cursor = !interactive
      ? 'default'
      : a.type === 'swipeUp'
        ? 'grab'
        : overHotspot
          ? 'pointer'
          : 'default'
  }

  const onDown = (p: ScreenPointer) => {
    if (!interactive) return
    const a = step.advance
    if (a.type === 'swipeUp') swipeStart.current = p.y
    if (a.type === 'tap' && inHotspot(p, a.hotspot)) next()
    if (a.type === 'end' && a.skip && inHotspot(p, a.skip)) skipped.current = true
    if (a.type === 'tapThenType') {
      if (typing === 'idle' && inHotspot(p, a.hotspot)) {
        typingRun.current = null // start a fresh timer for this message
        setTyping('typing')
      }
      if (typing === 'typed' && inHotspot(p, a.send)) {
        typingRun.current = null
        next()
      }
    }
  }

  const onUp = (p: ScreenPointer) => {
    if (step.advance.type !== 'swipeUp' || swipeStart.current === null) return
    if (swipeStart.current - p.y > SWIPE_DISTANCE) next()
    swipeStart.current = null
  }

  useEffect(() => () => void (document.body.style.cursor = 'default'), [])

  return (
    <group ref={follow}>
      <ambientLight intensity={0.1} />
      <e.pointLight theatreKey="Phone Light" position={[0.2, 0.3, 0.18]} intensity={opacity} />
      <e.group theatreKey="Phone">
        <Phone
          opacity={opacity}
          screen={typing !== 'idle' ? typingScreen.texture : textures[index]}
          onScreenDown={onDown}
          onScreenMove={onMove}
          onScreenUp={onUp}
        />
      </e.group>
    </group>
  )
}
