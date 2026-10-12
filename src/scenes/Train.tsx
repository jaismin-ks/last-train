import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { DoubleSide, MathUtils, type Mesh, type MeshStandardMaterial, type Object3D } from 'three'
import { DRACO } from '../data/street'
import markers from '../data/train-markers.json'
import { useGame } from '../store'

const TRAIN_MODEL = '/assets/models/train.glb'
/** Materials that really are see-through (the window glass). */
const SEE_THROUGH = ['windows']
/** Materials that should reflect light exactly like the train body. */
const MATCH_BODY = ['side_door', 'front_door']

/** Door + light settings. Door halves slide apart along the carriage. */
export const TRAIN = {
  doorSpeed: 2.2, // how quickly the doors move (higher = snappier)
  light: { color: '#e9fff2', intensity: 6, distance: 13 }, // one cold fluorescent per carriage
}

type Leaf = { node: Object3D; closedZ: number; dir: number; platform: boolean }

/**
 * The 3-carriage train, parked at the platform (positions baked in Blender).
 * Open/close the platform doors with useGame.getState().setTrainDoorsOpen(true/false).
 */
export function Train() {
  const { scene } = useGLTF(TRAIN_MODEL, DRACO)
  const doorsOpen = useGame((s) => s.trainDoorsOpen)

  // Each half slides away from the middle of its door: half A one way, B the other
  const leaves = useMemo<Leaf[]>(
    () =>
      markers.doors
        .map((d) => {
          const node = scene.getObjectByName(d.name)
          if (!node) return null
          // Blender -y (half A) becomes +z in three.js after the Y-up export
          return { node, closedZ: node.position.z, dir: d.half === 'A' ? 1 : -1, platform: d.side === 'platform' }
        })
        .filter((l): l is Leaf => l !== null),
    [scene],
  )

  useEffect(() => {
    let body: MeshStandardMaterial | undefined
    scene.traverse((o) => {
      const m = (o as Mesh).material as MeshStandardMaterial | undefined
      if (m?.name === 'Body') body = m
    })
    scene.traverse((o) => {
      const m = (o as Mesh).material as MeshStandardMaterial | undefined
      if (!(o as Mesh).isMesh || !m?.isMeshStandardMaterial) return
      m.side = DoubleSide
      m.metalness = Math.min(m.metalness, 0.3)
      // Doors and rails are marked "transparent" in the model but are solid;
      // as transparent they sorted wrongly and looked see-through. Only glass stays transparent.
      // Doors were shinier/more metallic than the body, so they caught light differently
      if (MATCH_BODY.includes(m.name) && body) {
        m.metalness = body.metalness
        m.roughness = body.roughness
        m.metalnessMap = body.metalnessMap
        m.roughnessMap = body.roughnessMap
        m.envMapIntensity = body.envMapIntensity
      }
      if (!SEE_THROUGH.includes(m.name)) {
        m.transparent = false
        m.opacity = 1
        m.depthWrite = true
        m.needsUpdate = true
      }
    })
  }, [scene])

  // Dev only: press T to open / close the doors while testing
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyT') return
      const st = useGame.getState()
      st.setTrainDoorsOpen(!st.trainDoorsOpen)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useFrame((_, dt) => {
    for (const l of leaves) {
      const target = l.closedZ + (doorsOpen && l.platform ? l.dir * markers.doorSlide : 0)
      l.node.position.z = MathUtils.damp(l.node.position.z, target, TRAIN.doorSpeed * 3, dt)
    }
  })

  return (
    <>
      <primitive object={scene} />
      {/* one light per carriage keeps the game light; markers.lights has 5 per car if needed */}
      {(markers.cars as [number, number, number][]).map((c) => [c[0], c[1] + 2.25, c[2]] as [number, number, number]).map((p, i) => (
        <pointLight key={i} position={p} color={TRAIN.light.color} intensity={TRAIN.light.intensity} distance={TRAIN.light.distance} decay={2} />
      ))}
    </>
  )
}

useGLTF.preload(TRAIN_MODEL, DRACO)
