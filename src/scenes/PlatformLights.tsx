import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshBasicMaterial, MeshStandardMaterial, type PointLight } from 'three'
import { useGame } from '../store'
import { PLATFORM_STORY } from '../data/platform'

/**
 * Fluorescent tube lights hanging along the platform (three.js coords).
 * Each is a glowing tube plus a light; one buzzes and flickers, two are dead,
 * and one is brighter and whiter than the rest (the "safe" spot in the story).
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
  /** Dim wash on the tunnel wall across the tracks (~10 m away; the tubes don't reach it). */
  farWall: { x: -77.4, y: -7.6, every: 16, intensity: 3.5, distance: 6, color: '#5fae84' },
  /** Each tube hangs from the ceiling in a metal housing on two rods. */
  fixture: { ceilingY: -4.05, rodSpacing: 1.0, color: '#2c312e' },
  /** The brightest tube: whiter, stronger, reaches further. */
  bright: { index: PLATFORM_STORY.brightTube, color: '#e4fff0', intensity: 16, distance: 11 },
}

/**
 * Per-tube brightness the story can drive (0 = off, 1 = normal), by tube index.
 * Written every frame by the platform story; plain array, no React re-renders.
 */
export const tubeLevel: number[] = []

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
  // One material per tube so each can dim on its own
  const mats = useMemo(
    () =>
      tubes.map((_, i) =>
        T.dead.includes(i)
          ? new MeshBasicMaterial({ color: '#1c2420' })
          : new MeshBasicMaterial({ color: i === T.bright.index ? T.bright.color : T.color, toneMapped: false, transparent: true }),
      ),
    [tubes, T],
  )
  const lights = useRef<(PointLight | null)[]>([])
  const metal = useMemo(() => new MeshStandardMaterial({ color: T.fixture.color, roughness: 0.6, metalness: 0.3 }), [T.fixture.color])
  const rodLength = T.fixture.ceilingY - (T.y + 0.06)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    tubes.forEach((_, i) => {
      if (T.dead.includes(i)) return
      const r = hash(Math.floor(t * 14) + i * 50)
      const flicker = T.flicker.includes(i) ? (r < 0.18 ? 0.04 : r < 0.3 ? 0.45 : 1) : 1
      const level = (tubeLevel[i] ?? 1) * flicker * (on ? 1 : 0)
      const base = i === T.bright.index ? T.bright.intensity : T.intensity
      const l = lights.current[i]
      if (l) l.intensity = base * level
      mats[i].opacity = Math.max(0.05, level)
    })
  })

  return (
    <>
      {Array.from({ length: Math.floor((T.to - T.from) / T.farWall.every) + 1 }, (_, k) => (
        <pointLight
          key={`wall-${k}`}
          position={[T.farWall.x, T.farWall.y, T.from + 4 + k * T.farWall.every]}
          color={T.farWall.color}
          intensity={on ? T.farWall.intensity : 0}
          distance={T.farWall.distance}
          decay={2}
        />
      ))}
      {tubes.map((z, i) => {
        const bright = i === T.bright.index
        return (
          <group key={i} position={[T.x, T.y, z]}>
            <mesh material={mats[i]}>
              <boxGeometry args={[0.09, 0.06, T.tubeLength]} />
            </mesh>
            {/* housing over the tube, hung from the ceiling on two rods */}
            <mesh material={metal} position={[0, 0.05, 0]}>
              <boxGeometry args={[0.16, 0.05, T.tubeLength + 0.12]} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh key={side} material={metal} position={[0, 0.06 + rodLength / 2, (side * T.fixture.rodSpacing) / 2]}>
                <cylinderGeometry args={[0.01, 0.01, rodLength, 6]} />
              </mesh>
            ))}
            {!T.dead.includes(i) && (
              <pointLight
                ref={(el) => (lights.current[i] = el)}
                position={[0, -0.15, 0]}
                color={bright ? T.bright.color : T.color}
                intensity={0}
                distance={bright ? T.bright.distance : T.distance}
                decay={2}
              />
            )}
          </group>
        )
      })}
    </>
  )
}

/** z of tube `i` along the platform. */
export const tubeZ = (i: number) => PLATFORM_TUBES.from + i * PLATFORM_TUBES.spacing
