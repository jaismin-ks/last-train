import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CatmullRomCurve3, MathUtils, Vector3 } from 'three'
import { EYE_HEIGHT, LOOK_BACK, ROUTE, WALK } from '../data/street'
import { usePlayerInput } from '../systems/usePlayerInput'
import { SubwayInteract } from './SubwayInteract'
import { useGame } from '../store'
import { CAPTIONS, STREET_CAPTION_TIME, THOUGHTS } from '../data/captions'
import { setFootsteps } from '../audio/sounds'

/**
 * On-rails first-person walking along the street route.
 *
 * - Forward (W / ↑) moves along the route.
 * - Back (S / ↓) retraces your steps while still facing forward:
 *   you can never turn around and walk back directly.
 * - The mouse turns the head left / right (and a little up / down) within
 *   limits, relative to the direction of the route.
 */
export function Player() {
  const frozen = useRef(false) // set when entering the subway
  const setCaption = useGame((s) => s.setCaption)
  const walkedFor = useRef(0) // seconds spent walking, to retire the caption
  const setThought = useGame((s) => s.setThought)
  const thoughtsDone = useRef(new Set<number>()) // route thoughts already shown
  useEffect(() => {
    setCaption(CAPTIONS.street.findSubway)
    return () => setCaption(null)
  }, [setCaption])
  const glance = useRef<{ start: number; side: number; angle: number } | null>(null) // current look back
  const nextGlance = useRef(0) // index into LOOK_BACK.at
  useEffect(() => () => setFootsteps(0), [])
  const camera = useThree((s) => s.camera)
  const input = usePlayerInput(true)

  const curve = useMemo(
    () => new CatmullRomCurve3(ROUTE.map(([x, z]) => new Vector3(x, EYE_HEIGHT, z)), false, 'centripetal'),
    [],
  )
  const length = useMemo(() => curve.getLength(), [curve])

  const distance = useRef(0) // metres along the route
  const yaw = useRef(0)
  const pitch = useRef(0)
  const bob = useRef(0)
  const pos = useMemo(() => new Vector3(), [])
  const ahead = useMemo(() => new Vector3(), [])
  const look = useMemo(() => new Vector3(), [])

  useFrame(({ clock }, dt) => {
    dt = Math.min(dt, 0.1) // avoid jumps after a tab switch
    const i = input.current

    // Move along the route (forward wins if both are held)
    const moving = frozen.current ? 0 : i.forward ? 1 : i.back ? -1 : 0
    const speed = moving > 0 ? WALK.speed : WALK.backSpeed
    const slow = glance.current ? LOOK_BACK.walkSlowdown : 1 // you slow down while checking behind you
    const before = distance.current
    distance.current = MathUtils.clamp(distance.current + moving * speed * slow * dt, 0, length)
    const advanced = distance.current !== before
    if (advanced && walkedFor.current < STREET_CAPTION_TIME) {
      walkedFor.current += dt
      if (walkedFor.current >= STREET_CAPTION_TIME) setCaption(null)
    }
    setFootsteps(advanced ? (moving > 0 ? (slow < 1 ? 0.95 : 1.25) : 0.9) : 0) // step rate follows the walking pace

    const u = distance.current / length

    // thoughts at points along the walk
    THOUGHTS.along.forEach((t, i) => {
      if (u >= t.at && !thoughtsDone.current.has(i)) {
        thoughtsDone.current.add(i)
        setThought(t.text)
      }
    })

    // Nervous glance back: triggered once at each point, only while walking forward
    if (!glance.current && moving > 0 && nextGlance.current < LOOK_BACK.at.length && u >= LOOK_BACK.at[nextGlance.current]) {
      glance.current = { start: clock.elapsedTime, side: nextGlance.current % 2 === 0 ? 1 : -1, angle: LOOK_BACK.angleDeg + (Math.random() * 20 - 10) }
      nextGlance.current++
    }
    let glanceK = 0
    let wobble = 0
    if (glance.current) {
      const { peek, peekTime, pause, turn, hold, back } = LOOK_BACK
      const t = clock.elapsedTime - glance.current.start
      const easeOut = (x: number) => 1 - (1 - x) * (1 - x)
      const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)
      const t1 = peekTime, t2 = t1 + pause, t3 = t2 + turn, t4 = t3 + hold, t5 = t4 + back
      if (t < t1) glanceK = peek * easeOut(t / t1) // hesitant half-turn
      else if (t < t2) glanceK = peek // freeze for a beat
      else if (t < t3) glanceK = peek + (1 - peek) * easeInOut((t - t2) / turn) // commit
      else if (t < t4) glanceK = 1 // look
      else if (t < t5) glanceK = 1 - easeInOut((t - t4) / back) // turn forward again
      else {
        glance.current = null
        // a thought right after looking back
        const line = THOUGHTS.afterGlance[nextGlance.current - 1]
        if (line) setThought(line)
      }
      // small, uneven head movement so it never looks like a camera on rails
      wobble = Math.sin(t * 7.3) * 0.6 + Math.sin(t * 3.1 + 1.7) * 0.4
    }    curve.getPointAt(u, pos)
    curve.getTangentAt(Math.min(u, 0.999), ahead) // direction the route faces

    // Head turns toward the mouse, eased, within limits
    const targetYaw = -i.lookX * MathUtils.degToRad(WALK.maxYawDeg)
    const targetPitch =
      i.lookY > 0 ? i.lookY * MathUtils.degToRad(WALK.maxPitchUpDeg) : i.lookY * MathUtils.degToRad(WALK.maxPitchDownDeg)
    yaw.current = MathUtils.damp(yaw.current, targetYaw, WALK.lookSmoothing, dt)
    pitch.current = MathUtils.damp(pitch.current, targetPitch, WALK.lookSmoothing, dt)

    // Subtle head bob while moving
    if (moving !== 0) bob.current += dt * WALK.bobSpeed * (moving > 0 ? 1 : 0.7)
    const bobY = moving !== 0 ? Math.sin(bob.current) * WALK.bobAmount : 0

    camera.position.set(pos.x, pos.y + bobY, pos.z)

    // Look direction = route direction rotated by yaw, tilted by pitch
    const baseYaw = Math.atan2(ahead.x, ahead.z)
    const glanceYaw = glance.current ? glance.current.side * MathUtils.degToRad(glance.current.angle + wobble * 2) * glanceK : 0
    // the head dips a little while looking back
    const lookPitch = pitch.current * (1 - glanceK) - MathUtils.degToRad(LOOK_BACK.dipDeg) * glanceK
    const y = baseYaw + yaw.current * (1 - glanceK) + glanceYaw
    look.set(
      pos.x + Math.sin(y) * Math.cos(lookPitch),
      pos.y + bobY + Math.sin(lookPitch),
      pos.z + Math.cos(y) * Math.cos(lookPitch),
    )
    camera.lookAt(look)
    // head tilts into the turn
    if (glanceK > 0 && glance.current) camera.rotateZ(-glance.current.side * MathUtils.degToRad(LOOK_BACK.tiltDeg) * glanceK)
  })

  return <SubwayInteract onEnter={() => (frozen.current = true)} />
}
