import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Raycaster, Vector3, type Object3D, type PerspectiveCamera } from 'three'
import { EYE_ABOVE_FLOOR, RUN, WALK } from '../data/street'
import { usePlayerInput } from '../systems/usePlayerInput'
import { setFootsteps, setHeartbeat } from '../audio/sounds'
import { useGame } from '../store'
import { FEAR } from '../data/fear'
import { fearFocus } from '../systems/fear'

/** Free walking area: the platform (three.js coords). */
export type Area = { minX: number; maxX: number; minZ: number; maxZ: number; floorY: number }

/**
 * Controls: WASD walk (W/S forward/back where you're looking, A/D sideways).
 * The mouse looks and turns (the cursor is never locked): the head turns
 * toward the cursor, and holding it near the left/right edge keeps turning you.
 */
const LOOK = {
  edgeStart: 0.6, // how far from the middle (0–1) the cursor starts turning you
  turnSpeed: 1.8, // radians per second with the cursor at the very edge
  maxPitchDeg: 35, // looking up / down (higher than the street: CCTV, ceiling)
}
const WALL_GAP = 0.45 // metres kept between you and walls
/** Camera rumble the scene can set (metres of random jitter), e.g. a moving train. */
export const cameraShake = { amount: 0 }

/**
 * Sitting down (the scene sets this; FreeRoam follows it). While `active` you
 * stay put at x/z with your eyes at `eye` metres above the floor, facing
 * `heading`; standing up moves you to standX/standZ (the aisle).
 */
export const seat = { active: false, x: 0, z: 0, eye: 1.1, heading: 0, standX: 0, standZ: 0, changed: false }
const STRAFE_KEYS = ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight']

/**
 * First-person free walking: WASD walk where you're looking (A/D sideways),
 * the mouse looks and turns (see LOOK), Shift runs.
 * You stay inside `area` and can't walk through walls (`collide` meshes).
 */
export function FreeRoam({ area, collide, start, startHeading }: { area: Area; collide: Object3D; start: Vector3; startHeading: number }) {
  const camera = useThree((s) => s.camera)
  const input = usePlayerInput(true)
  const setStamina = useGame((s) => s.setStamina)

  const body = useRef(startHeading) // which way you're turned
  const head = useRef(0) // head turn on top of that, toward the cursor
  const yaw = useRef(startHeading) // where you're looking: body + head
  const pitch = useRef(0)
  const pos = useMemo(() => new Vector3(start.x, area.floorY, start.z), [start, area])
  const strafe = useRef({ left: false, right: false })
  const stamina = useRef(useGame.getState().stamina)
  const exhausted = useRef(false)
  const sinceRun = useRef(0)
  const bob = useRef(0)
  const eye = useRef(EYE_ABOVE_FLOOR) // eye height above the floor (lower when sitting)
  const baseFov = useRef(60) // view width when calm (degrees)
  const ray = useMemo(() => new Raycaster(), [])
  const tmp = useMemo(() => ({ move: new Vector3(), from: new Vector3(), look: new Vector3() }), [])

  // A/D step sideways
  useEffect(() => {
    const key = (down: boolean) => (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') strafe.current.left = down
      if (e.code === 'KeyD' || e.code === 'ArrowRight') strafe.current.right = down
      if (STRAFE_KEYS.includes(e.code)) e.preventDefault()
    }
    const kd = key(true)
    const ku = key(false)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      setFootsteps(0)
      setHeartbeat(false)
    }
  }, [])

  /** True if a wall is within WALL_GAP + step of `pos` in direction `dir`. */
  const blocked = (dir: Vector3, step: number) => {
    tmp.from.set(pos.x, area.floorY + 0.9, pos.z)
    ray.set(tmp.from, dir)
    ray.far = WALL_GAP + step
    return ray.intersectObject(collide, true).some((h) => h.object.visible)
  }

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.1)
    const i = input.current
    const fwd = (i.forward ? 1 : 0) - (i.back ? 1 : 0)
    const side = (strafe.current.right ? 1 : 0) - (strafe.current.left ? 1 : 0)
    const locked = useGame.getState().inputLocked
    // Sat down / stood up since last frame
    if (seat.changed) {
      seat.changed = false
      if (seat.active) {
        pos.set(seat.x, area.floorY, seat.z)
        body.current = seat.heading
        head.current = 0
      } else pos.set(seat.standX, area.floorY, seat.standZ)
    }
    eye.current = MathUtils.damp(eye.current, seat.active ? seat.eye : EYE_ABOVE_FLOOR, 5, dt)
    const { stress, panic } = useGame.getState()
    const frozen = locked || panic // panic: you can barely move or look away
    const moving = !locked && !seat.active && (fwd !== 0 || side !== 0)

    // Fear narrows your view
    const fov = baseFov.current - FEAR.fovDrop * stress
    if (Math.abs((camera as PerspectiveCamera).fov - fov) > 0.05) {
      ;(camera as PerspectiveCamera).fov = fov
      camera.updateProjectionMatrix()
    }

    // Running: same energy rules as on the route
    if (exhausted.current && stamina.current >= RUN.minToStart) exhausted.current = false
    const running = moving && fwd > 0 && i.run && !exhausted.current && stamina.current > 0
    if (running) {
      stamina.current = Math.max(0, stamina.current - RUN.drainPerSecond * dt)
      sinceRun.current = 0
      if (stamina.current === 0) exhausted.current = true
    } else {
      sinceRun.current += dt
      if (sinceRun.current > RUN.refillDelay) stamina.current = Math.min(1, stamina.current + RUN.refillPerSecond * dt)
    }
    setStamina(stamina.current, running)
    setHeartbeat(running || useGame.getState().fear)

    // In a panic you can't look away: your gaze is dragged to him
    if (panic && fearFocus.active) {
      const want = Math.atan2(fearFocus.x - pos.x, fearFocus.z - pos.z)
      const diff = Math.atan2(Math.sin(want - body.current), Math.cos(want - body.current))
      body.current += diff * (1 - Math.exp(-FEAR.panicStare * dt))
      head.current = MathUtils.damp(head.current, 0, FEAR.panicStare, dt)
      const flat = Math.hypot(fearFocus.x - pos.x, fearFocus.z - pos.z)
      const wantPitch = Math.atan2(fearFocus.y - (area.floorY + eye.current), Math.max(flat, 0.1))
      pitch.current = MathUtils.damp(pitch.current, wantPitch, FEAR.panicStare, dt)
    }
    // Head turns toward the cursor; near the left/right edge the body keeps turning
    if (!frozen) {
      const x = i.lookX
      const edge = MathUtils.smoothstep(Math.abs(x), LOOK.edgeStart, 1) * Math.sign(x)
      body.current -= edge * LOOK.turnSpeed * dt
      const targetHead = -x * MathUtils.degToRad(WALK.maxYawDeg)
      head.current = MathUtils.damp(head.current, targetHead, WALK.lookSmoothing, dt)
      const targetPitch = i.lookY * MathUtils.degToRad(LOOK.maxPitchDeg)
      pitch.current = MathUtils.damp(pitch.current, targetPitch, WALK.lookSmoothing, dt)
    }
    yaw.current = body.current + head.current

    let advanced = false
    if (moving) {
      const speed =
        (fwd < 0 && side === 0 ? WALK.backSpeed : WALK.speed) *
        (running && !panic ? RUN.speedMultiplier : 1) *
        (panic ? FEAR.panicCrawl : 1 - FEAR.slowDown * stress)
      // forward = where you're looking (flattened), right = perpendicular
      const fx = Math.sin(yaw.current), fz = Math.cos(yaw.current)
      tmp.move.set(fx * fwd - fz * side, 0, fz * fwd + fx * side).normalize()
      const step = speed * dt
      // move along each axis separately so you slide along walls
      for (const axis of ['x', 'z'] as const) {
        const d = tmp.move[axis] * step
        if (Math.abs(d) < 1e-5) continue
        const dir = new Vector3(axis === 'x' ? Math.sign(d) : 0, 0, axis === 'z' ? Math.sign(d) : 0)
        if (blocked(dir, Math.abs(d))) continue
        const next = pos[axis] + d
        const [lo, hi] = axis === 'x' ? [area.minX, area.maxX] : [area.minZ, area.maxZ]
        if (next < lo || next > hi) continue
        pos[axis] = next
        advanced = true
      }
    }
    setFootsteps(advanced ? (running ? 1.75 : 1.2) : 0)
    if (advanced) bob.current += dt * WALK.bobSpeed * (running ? 1.6 : 1)
    const bobY = advanced ? Math.sin(bob.current) * WALK.bobAmount * (useGame.getState().reduceMotion ? 0 : 1) : 0

    camera.position.set(pos.x, area.floorY + eye.current + bobY, pos.z)
    const shake = cameraShake.amount + (panic ? FEAR.panicTremble : 0) // trembling in a panic
    if (shake > 0) {
      const a = shake * (useGame.getState().reduceMotion ? 0.2 : 1)
      camera.position.x += (Math.random() - 0.5) * a
      camera.position.y += (Math.random() - 0.5) * a
    }
    const cp = Math.cos(pitch.current)
    tmp.look.set(
      pos.x + Math.sin(yaw.current) * cp,
      camera.position.y + Math.sin(pitch.current),
      pos.z + Math.cos(yaw.current) * cp,
    )
    camera.lookAt(tmp.look)
  })

  return null
}
