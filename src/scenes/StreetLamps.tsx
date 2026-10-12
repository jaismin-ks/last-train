import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box3, Color, Vector3, type Mesh, type MeshStandardMaterial, type Object3D, type PointLight } from 'three'
import { LAMP_LIGHT, LAMP_STATES, LAMPS, type LampState } from '../data/street'

const BLACK = new Color(0, 0, 0)

/** Deterministic pseudo-random 0–1 from a number. */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Flicker pattern: mostly on, with short random dropouts and a faint buzz.
 * Changes every ~1/14 s; long dark gaps now and then.
 */
function flicker(t: number, seed: number) {
  const step = Math.floor(t * 14)
  const r = hash(step + seed * 1000)
  const longOut = hash(Math.floor(t * 0.6) + seed) > 0.75 && r < 0.6 // occasional longer blackout
  if (longOut || r < 0.12) return 0.03
  if (r < 0.22) return 0.4
  return 0.9 + Math.sin(t * 90) * 0.05 // electrical buzz
}

/** Finds the glowing glass meshes of the lamp at `pos` and gives them their own material. */
function lampGlass(scene: Object3D, pos: Vector3): MeshStandardMaterial[] {
  const found: MeshStandardMaterial[] = []
  const box = new Box3()
  const centre = new Vector3()
  scene.traverse((o) => {
    const mesh = o as Mesh
    if (!mesh.isMesh) return
    const mat = mesh.material as MeshStandardMaterial
    if (!mat?.isMeshStandardMaterial) return
    const glows = mat.emissiveMap || mat.emissive.getHex() !== 0
    if (!glows) return
    box.setFromObject(mesh).getCenter(centre)
    if (centre.distanceTo(pos) > 1.2) return
    const own = mat.clone() // so dimming this lamp doesn't dim the others
    mesh.material = own
    found.push(own)
  })
  return found
}

function Lamp({ scene, pos, state, index, brightness }: { scene: Object3D; pos: [number, number, number]; state: LampState; index: number; brightness: number }) {
  const light = useRef<PointLight>(null)
  const glass = useMemo(() => lampGlass(scene, new Vector3(...pos)), [scene, pos])

  // Warm tint on the glass of every lamp
  useEffect(() => {
    for (const m of glass) m.emissive.set(LAMP_LIGHT.glassColor)
  }, [glass])
  const glow = useMemo(() => glass.map((m) => ({ m, colour: new Color(LAMP_LIGHT.glassColor), intensity: m.emissiveIntensity })), [glass])

  useEffect(() => {
    if (state !== 'dead') return
    for (const { m } of glow) m.emissive.copy(BLACK)
  }, [state, glow])

  useFrame(({ clock }) => {
    if (state !== 'flicker' || !light.current) return
    const f = flicker(clock.elapsedTime, index)
    light.current.intensity = LAMP_LIGHT.intensity * brightness * f
    for (const { m, colour, intensity } of glow) {
      m.emissive.copy(colour)
      m.emissiveIntensity = intensity * f
    }
  })

  if (state === 'dead') return null
  return (
    <pointLight
      ref={light}
      position={pos}
      color={LAMP_LIGHT.color}
      intensity={LAMP_LIGHT.intensity * brightness}
      distance={LAMP_LIGHT.distance}
      decay={2}
    />
  )
}

/** All street lamp lights, each steady, flickering or dead (see LAMP_STATES). */
export function StreetLamps({ scene, brightness }: { scene: Object3D; brightness: number }) {
  return (
    <>
      {LAMPS.map((pos, i) => (
        <Lamp key={i} scene={scene} pos={pos} state={LAMP_STATES[i] ?? 'on'} index={i} brightness={brightness} />
      ))}
    </>
  )
}
