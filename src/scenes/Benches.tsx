import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Raycaster, Vector3, type Mesh, type Object3D } from 'three'
import { useGame } from '../store'
import { seat, standing } from './FreeRoam'

/**
 * The benches along the platform's back wall: C sits down, C again stands up,
 * the same as the seats on the train. They're one merged mesh in the station
 * model, so the seats are found by probing it from above along the bench line.
 */
export const BENCHES = {
  mesh: 'Base_87m_0',
  x: -66.72, // along the middle of the seats (three.js x)
  probe: { fromZ: 45, toZ: 77, step: 0.1, topMin: -9.8, topMax: -9.2, maxGap: 0.6 }, // seat tops sit in this height band
  spacing: 0.6, // one sitting spot per this much bench
  reach: 1.1, // how close you need to be to sit
  eyeAboveSeat: 0.78,
  heading: -Math.PI / 2, // sitting with your back to the wall, facing the tracks
  standX: -67.6, // stand up a step out from the bench
  sitPrompt: 'C|sit',
  standPrompt: 'C|stand',
}

type Spot = { x: number; z: number; y: number }

function findBenches(scene: Object3D): Spot[] {
  const bench = scene.getObjectByName(BENCHES.mesh) as Mesh | undefined
  if (!bench) return []
  bench.updateWorldMatrix(true, false)
  const { fromZ, toZ, step, topMin, topMax } = BENCHES.probe
  const ray = new Raycaster()
  const down = new Vector3(0, -1, 0)
  const spots: Spot[] = []
  let run: { z: number; y: number }[] = []
  const flush = () => {
    if (run.length > 3) {
      const from = run[0].z
      const to = run[run.length - 1].z
      const n = Math.max(1, Math.round((to - from) / BENCHES.spacing))
      for (let k = 0; k < n; k++) spots.push({ x: BENCHES.x, z: from + ((k + 0.5) * (to - from)) / n, y: run[0].y })
    }
    run = []
  }
  for (let z = fromZ; z <= toZ; z += step) {
    ray.set(new Vector3(BENCHES.x, -8, z), down)
    ray.far = 3
    const hit = ray.intersectObject(bench, false)[0]
    if (!hit || hit.point.y < topMin || hit.point.y > topMax) continue
    // a bench is a row of separate seats: small gaps between them don't end it
    if (run.length && z - run[run.length - 1].z > BENCHES.probe.maxGap) flush()
    run.push({ z, y: hit.point.y })
  }
  flush()
  return spots
}

/** Sitting on the platform benches. Mount alongside the platform's FreeRoam. */
export function Benches({ scene, floorY }: { scene: Object3D; floorY: number }) {
  const spots = useMemo(() => findBenches(scene), [scene])
  const near = useRef<Spot | null>(null)
  const shown = useRef<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = useGame.getState()
      if (e.code !== 'KeyC' || e.repeat || g.paused || g.inputLocked || g.panic) return
      if (seat.active) {
        Object.assign(seat, { active: false, changed: true })
        return
      }
      const s = near.current
      if (!s) return
      Object.assign(seat, {
        active: true,
        changed: true,
        x: s.x,
        z: s.z,
        eye: s.y + BENCHES.eyeAboveSeat - floorY,
        heading: BENCHES.heading,
        standX: BENCHES.standX,
        standZ: s.z,
      })
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      seat.active = false
      if (shown.current) useGame.getState().setPrompt(null)
    }
  }, [floorY])

  useFrame(() => {
    let best = BENCHES.reach
    let nearest: Spot | null = null
    for (const s of spots) {
      const d = Math.hypot(standing.x - s.x, standing.z - s.z)
      if (d < best) {
        best = d
        nearest = s
      }
    }
    near.current = nearest
    const g = useGame.getState()
    // only our own hint: never over another prompt, and not while you can't move
    const want = g.inputLocked || g.panic ? null : seat.active ? BENCHES.standPrompt : nearest ? BENCHES.sitPrompt : null
    if (want !== shown.current && (g.prompt === shown.current || g.prompt === null)) {
      shown.current = want
      g.setPrompt(want)
    }
  })

  return null
}
