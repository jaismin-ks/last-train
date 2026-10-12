import { useMemo, useRef } from 'react'
import { useGame } from '../store'
import { useFrame } from '@react-three/fiber'
import type { PointLight } from 'three'

type V3 = [number, number, number]

/**
 * Liminal station lighting, from the Pinterest board: mostly cold green
 * fluorescent pools along the route, a sickly warm zone, and sparse red.
 * Lights are placed automatically along the walking route.
 */
export const STATION_LIGHT = {
  spacing: 9, // route points (~1 m each) between ceiling lights
  height: 3.1, // metres above the floor
  colors: {
    green: '#6dffb4', // fluorescent tube, the main look
    warm: '#e2c46a', // tired yellow (stairs bottom / side room)
    red: '#ff2b22', // emergency light, used sparingly
  },
  intensity: { green: 14, warm: 11, red: 9 },
  distance: { green: 11, warm: 10, red: 8 },
  /** Which part of the route gets which colour (fraction 0 = start, 1 = platform end). */
  zones: [
    { from: 0.24, to: 0.38, color: 'warm' }, // bottom of the escalator and the side room
    { from: 0.6, to: 0.64, color: 'red' }, // corridor bend before the platform
    { from: 0.97, to: 1.01, color: 'red' }, // far end of the platform
  ] as { from: number; to: number; color: 'warm' | 'red' }[],
  /** These light indices flicker; this one is dead (dark gap). */
  flicker: [3, 11],
  dead: [7],
  /** Extra lights over the escalator so it isn't a black hole, [x, y, z] (three.js). */
  escalator: [
    [-9.5, 3.4, 12.24],
    [-15.5, 1.2, 12.24],
    [-22.5, -1.6, 12.24],
  ] as V3[],
  escalatorLight: { color: '#e8b76a', intensity: 4, distance: 9 }, // warm and dim, like an old tunnel bulb
}

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function StationLights({ route }: { route: V3[] }) {
  const lights = useMemo(() => {
    const out: { pos: V3; color: 'green' | 'warm' | 'red'; index: number }[] = []
    for (let i = 2, n = 0; i < route.length; i += STATION_LIGHT.spacing, n++) {
      const f = i / (route.length - 1)
      const zone = STATION_LIGHT.zones.find((z) => f >= z.from && f < z.to)
      const [x, y, z] = route[i]
      out.push({ pos: [x, y + STATION_LIGHT.height, z], color: zone?.color ?? 'green', index: n })
    }
    // always a red one at the very end of the platform
    const [x, y, z] = route[route.length - 1]
    out.push({ pos: [x, y + STATION_LIGHT.height, z], color: 'red', index: out.length })
    return out.filter((l) => !STATION_LIGHT.dead.includes(l.index))
  }, [route])

  const refs = useRef<(PointLight | null)[]>([])
  const on = useGame((s) => s.platformLightsOn) // the story can switch the station dark
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    lights.forEach((l, k) => {
      const light = refs.current[k]
      if (!light || !STATION_LIGHT.flicker.includes(l.index)) return
      const r = hash(Math.floor(t * 12) + l.index * 100)
      const f = r < 0.15 ? 0.05 : r < 0.25 ? 0.5 : 1
      light.intensity = STATION_LIGHT.intensity[l.color] * f * (on ? 1 : 0)
    })
  })

  const e = STATION_LIGHT.escalatorLight
  return (
    <>
      {STATION_LIGHT.escalator.map((p, k) => (
        <pointLight key={`esc-${k}`} position={p} color={e.color} intensity={e.intensity} distance={e.distance} decay={2} />
      ))}
      {lights.map((l, k) => (
        <pointLight
          key={k}
          ref={(el) => (refs.current[k] = el)}
          position={l.pos}
          color={STATION_LIGHT.colors[l.color]}
          intensity={on ? STATION_LIGHT.intensity[l.color] : 0}
          distance={STATION_LIGHT.distance[l.color]}
          decay={2}
        />
      ))}
    </>
  )
}
