import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Box3, DoubleSide, MathUtils, Vector3, type Group, type Mesh, type MeshStandardMaterial, type Object3D } from 'three'
import { DRACO } from '../data/street'
import markers from '../data/train-markers.json'
import { useGame } from '../store'
import { TRAIN_ARRIVAL } from '../data/platform'

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

/** Middle of each platform-side door when the train is stopped (filled once the model loads). */
export const trainDoorCenters: Vector3[] = []

/**
 * The 3-carriage train (stopped position baked in Blender). Hidden until
 * setTrainState('arriving'): then it pulls in from the far end of the tunnel,
 * slows to a stop and opens its platform doors.
 * Open/close the doors by hand with useGame.getState().setTrainDoorsOpen(true/false).
 */
export function Train() {
  const { scene } = useGLTF(TRAIN_MODEL, DRACO)
  const doorsOpen = useGame((s) => s.trainDoorsOpen)
  const trainState = useGame((s) => s.trainState)
  const group = useRef<Group>(null)
  const arrivedAt = useRef<number | null>(null)
  const startedAt = useRef<number | null>(null)
  // Front of the train (far end of the platform), for the headlight
  const front = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    return new Vector3(markers.cars[0][0], box.min.y + 1.6, box.max.z + 0.3)
  }, [scene])

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

  // Door middles: average of the two halves' world positions (train at its stop)
  useMemo(() => {
    scene.updateMatrixWorld(true)
    trainDoorCenters.length = 0
    const pairs = new Map<string, Vector3[]>()
    for (const d of markers.doors) {
      if (d.side !== 'platform') continue
      const node = scene.getObjectByName(d.name)
      if (!node) continue
      const key = d.name.replace(/_[AB]$/, '')
      pairs.set(key, [...(pairs.get(key) ?? []), node.getWorldPosition(new Vector3())])
    }
    pairs.forEach((ps) => trainDoorCenters.push(ps.reduce((a, b) => a.add(b), new Vector3()).divideScalar(ps.length)))
  }, [scene])

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
        // Some door panels came out of Blender with normals pointing into the car,
        // so the carriage light lit them from inside and they glowed pale.
        // Rebuild the normals from the faces so every door shades the same.
        const geo = (o as Mesh).geometry
        if (!geo.userData.normalsFixed) {
          geo.computeVertexNormals()
          geo.userData.normalsFixed = true
        }
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

  useFrame(({ clock }, dt) => {
    const g = group.current
    if (g) {
      g.visible = trainState !== 'hidden'
      if (trainState === 'arriving') {
        if (startedAt.current === null) startedAt.current = clock.elapsedTime
        const k = Math.min(1, (clock.elapsedTime - startedAt.current) / TRAIN_ARRIVAL.time)
        const ease = 1 - (1 - k) ** 3 // fast in, braking to a stop
        g.position.z = TRAIN_ARRIVAL.distance * (1 - ease)
        if (k >= 1) useGame.getState().setTrainState('stopped')
      } else if (trainState === 'stopped') {
        g.position.z = 0
        if (arrivedAt.current === null) arrivedAt.current = clock.elapsedTime
        if (clock.elapsedTime - arrivedAt.current > TRAIN_ARRIVAL.doorsAfter && !useGame.getState().trainDoorsOpen && arrivedAt.current > 0) {
          arrivedAt.current = -1 // doors open once; after that they're left to the story
          useGame.getState().setTrainDoorsOpen(true)
        }
      }
    }
    for (const l of leaves) {
      const target = l.closedZ + (doorsOpen && l.platform ? l.dir * markers.doorSlide : 0)
      l.node.position.z = MathUtils.damp(l.node.position.z, target, TRAIN.doorSpeed * 3, dt)
    }
  })

  return (
    <group ref={group} visible={false}>
      <primitive object={scene} />
      {trainState === 'arriving' && (
        <pointLight
          position={front.toArray()}
          color={TRAIN_ARRIVAL.headlight.color}
          intensity={TRAIN_ARRIVAL.headlight.intensity}
          distance={TRAIN_ARRIVAL.headlight.distance}
          decay={2}
        />
      )}
      {/* one light per carriage keeps the game light; markers.lights has 5 per car if needed */}
      {(markers.cars as [number, number, number][]).map((c) => [c[0], c[1] + 2.25, c[2]] as [number, number, number]).map((p, i) => (
        <pointLight key={i} position={p} color={TRAIN.light.color} intensity={TRAIN.light.intensity} distance={TRAIN.light.distance} decay={2} />
      ))}
    </group>
  )
}

useGLTF.preload(TRAIN_MODEL, DRACO)
