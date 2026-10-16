import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, CanvasTexture, MeshBasicMaterial, MeshStandardMaterial, SpriteMaterial, type PointLight } from 'three'

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
  glowIntensity: 1.6, // red light thrown onto the steps at each end
  haloSize: 0.32, // metres across the soft glow around each lamp
  period: 1.4, // seconds per blink
}

/** Soft round glow, drawn once. */
function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.2, 'rgba(255,255,255,0.5)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return new CanvasTexture(c)
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
  const housing = useMemo(() => new MeshStandardMaterial({ color: '#1d1f1e', roughness: 0.7, metalness: 0.3 }), [])
  const halo = useMemo(
    () => new SpriteMaterial({ map: glowTexture(), color: ESC.color, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  )
  const glows = useRef<(PointLight | null)[]>([])

  useFrame(({ clock }) => {
    const phase = (clock.elapsedTime % ESC.period) / ESC.period
    const on = phase < 0.55 ? 1 : 0.08 // mostly on, short dark beat
    mat.opacity = on
    halo.opacity = on * 0.9
    glows.current.forEach((g) => g && (g.intensity = ESC.glowIntensity * on))
  })

  return (
    <>
      {/* each one a small lamp: dark housing, glowing red lens, soft halo */}
      {leds.map((p, i) => (
        <group key={i} position={p}>
          <mesh material={housing}>
            <boxGeometry args={[0.1, 0.04, 0.07]} />
          </mesh>
          <mesh material={mat} position={[0, 0.022, 0]}>
            <boxGeometry args={[0.07, 0.012, 0.045]} />
          </mesh>
          <sprite material={halo} scale={ESC.haloSize} position={[0, 0.05, 0]} />
        </group>
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
