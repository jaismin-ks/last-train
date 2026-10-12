import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshBasicMaterial, type PointLight } from 'three'
import { useGame } from '../store'

/**
 * Fluorescent tube lights hanging along the platform (three.js coords).
 * Each is a glowing tube plus a light; one buzzes and flickers, one is dead.
 */
export const PLATFORM_TUBES = {
  x: -68.6, // over the middle of the platform
  y: -7.0, // tube height (floor is at -10.02)
  from: 27, // first tube along the platform (z)
  to: 88, // last tube
  spacing: 9, // metres between tubes
  tubeLength: 1.4,
  color: '#6dff9e', // sickly green fluorescent
  intensity: 7,
  distance: 9, // short reach: pools of light with dark gaps between
  flicker: [3], // the one tube that flickers
  dead: [1, 5], // tubes that are out (dark stretches)
}

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function PlatformLights() {
  const on = useGame((s) => s.platformLightsOn)
  const T = PLATFORM_TUBES
  const tubes = useMemo(() => {
    const out: number[] = []
    for (let z = T.from; z <= T.to; z += T.spacing) out.push(z)
    return out
  }, [T.from, T.to, T.spacing])
  const lit = useMemo(() => new MeshBasicMaterial({ color: T.color, toneMapped: false }), [T.color])
  const off = useMemo(() => new MeshBasicMaterial({ color: '#1c2420' }), [])
  const flick = useMemo(() => new MeshBasicMaterial({ color: T.color, toneMapped: false, transparent: true }), [T.color])
  const lights = useRef<(PointLight | null)[]>([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    tubes.forEach((_, i) => {
      if (!T.flicker.includes(i)) return
      const r = hash(Math.floor(t * 14) + i * 50)
      const f = r < 0.18 ? 0.04 : r < 0.3 ? 0.45 : 1
      const l = lights.current[i]
      if (l) l.intensity = T.intensity * f * (on ? 1 : 0)
      flick.opacity = on ? f : 0.05
    })
  })

  return (
    <>
      {tubes.map((z, i) => {
        const dead = T.dead.includes(i) || !on
        return (
          <group key={i} position={[T.x, T.y, z]}>
            <mesh material={dead ? off : T.flicker.includes(i) ? flick : lit}>
              <boxGeometry args={[0.09, 0.06, T.tubeLength]} />
            </mesh>
            {!T.dead.includes(i) && (
              <pointLight
                ref={(el) => (lights.current[i] = el)}
                position={[0, -0.15, 0]}
                color={T.color}
                intensity={on ? T.intensity : 0}
                distance={T.distance}
                decay={2}
              />
            )}
          </group>
        )
      })}
    </>
  )
}
