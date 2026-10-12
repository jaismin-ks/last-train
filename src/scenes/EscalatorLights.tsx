import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshBasicMaterial, type PointLight } from 'three'

type V3 = [number, number, number]

/**
 * Small red step lights where your feet go, at both edges of every escalator,
 * at the top and the bottom comb plates. They blink slowly.
 */
const ESC = {
  lanes: [14.8, 12.24, 9.68], // lane centres (three.js z)
  halfWidth: 0.6, // from lane centre to the light
  ends: [
    { x: -10.45, y: 0.12 }, // top
    { x: -21.95, y: -4.94 }, // bottom
  ],
  color: '#ff1a10',
  glowIntensity: 1.2, // red light thrown onto the steps at each end
  period: 1.4, // seconds per blink
}

export function EscalatorLights() {
  const leds = useMemo(() => {
    const out: V3[] = []
    for (const e of ESC.ends)
      for (const c of ESC.lanes) for (const s of [-1, 1]) out.push([e.x, e.y, c + s * ESC.halfWidth])
    return out
  }, [])
  // one shared material, so every LED blinks together
  const mat = useMemo(() => new MeshBasicMaterial({ color: ESC.color, toneMapped: false, transparent: true }), [])
  const glows = useRef<(PointLight | null)[]>([])

  useFrame(({ clock }) => {
    const phase = (clock.elapsedTime % ESC.period) / ESC.period
    const on = phase < 0.55 ? 1 : 0.08 // mostly on, short dark beat
    mat.opacity = on
    glows.current.forEach((g) => g && (g.intensity = ESC.glowIntensity * on))
  })

  return (
    <>
      {leds.map((p, i) => (
        <mesh key={i} position={p} material={mat}>
          <sphereGeometry args={[0.035, 8, 6]} />
        </mesh>
      ))}
      {ESC.ends.map((e, i) => (
        <pointLight
          key={i}
          ref={(el) => (glows.current[i] = el)}
          position={[e.x, e.y + 0.3, ESC.lanes[1]]}
          color={ESC.color}
          intensity={ESC.glowIntensity}
          distance={4}
          decay={2}
        />
      ))}
    </>
  )
}
