import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CatmullRomCurve3, MathUtils, Vector3 } from 'three'
import { EYE_HEIGHT, ROUTE, WALK } from '../data/street'
import { usePlayerInput } from '../systems/usePlayerInput'

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

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.1) // avoid jumps after a tab switch
    const i = input.current

    // Move along the route (forward wins if both are held)
    const moving = i.forward ? 1 : i.back ? -1 : 0
    const speed = moving > 0 ? WALK.speed : WALK.backSpeed
    distance.current = MathUtils.clamp(distance.current + moving * speed * dt, 0, length)

    const u = distance.current / length
    curve.getPointAt(u, pos)
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
    const y = baseYaw + yaw.current
    look.set(
      pos.x + Math.sin(y) * Math.cos(pitch.current),
      pos.y + bobY + Math.sin(pitch.current),
      pos.z + Math.cos(y) * Math.cos(pitch.current),
    )
    camera.lookAt(look)
  })

  return null
}
