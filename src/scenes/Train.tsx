import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  AdditiveBlending,
  Box3,
  CanvasTexture,
  Color,
  DoubleSide,
  MathUtils,
  Object3D,
  SpriteMaterial,
  Vector3,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  type PointLight,
} from 'three'
import { DRACO } from '../data/street'
import markers from '../data/train-markers.json'
import { useGame } from '../store'
import { TRAIN_ARRIVAL } from '../data/platform'
import { playTrainDoors } from '../audio/sounds'

export const TRAIN_MODEL = '/assets/models/train.glb'
/** Materials that really are see-through (the window glass). */
const SEE_THROUGH = ['windows']
/** Materials that should reflect light exactly like the train body. */
const MATCH_BODY = ['side_door', 'front_door']

/** Door + light settings. Door halves slide apart along the carriage. */
export const TRAIN = {
  doorSpeed: 2.2, // how quickly the doors move (higher = snappier)
  light: { color: '#e9fff2', intensity: 6, distance: 13 }, // one cold fluorescent per carriage
  glassOpacity: 0.3, // window glass: 0 = invisible, 1 = solid
}

type Leaf = { node: Object3D; closedZ: number; dir: number; platform: boolean }

/**
 * Carriage lights the story can drive: `level` 0–1 (flicker, dim) and
 * `emergency` 0–1 (blends to dim red emergency lighting).
 */
export const trainLights = { level: 1, emergency: 0 }
const EMERGENCY_COLOR = new Color('#ff4a32')
const NORMAL_COLOR = new Color(TRAIN.light.color)

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
  const lights = useRef<(PointLight | null)[]>([])
  const arrivedAt = useRef<number | null>(null)
  const startedAt = useRef<number | null>(null)
  // Front of the train: it pulls in heading toward the gate (-z), so the leading
  // end is the -z end. Headlights there, aimed down the tunnel ahead.
  const head = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const z = box.min.z
    const y = markers.cars[0][1] + TRAIN_ARRIVAL.headlight.height
    const x = markers.cars[0][0]
    const target = new Object3D()
    target.position.set(x, y - 1.2, z - 30) // ahead and a little down: track, walls, platform edge
    return { pos: new Vector3(x, y, z - 0.25), lampZ: z - 0.03, x, y, target }
  }, [scene])
  const lampGlow = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.15, 'rgba(255,255,255,0.7)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 64, 64)
    return new SpriteMaterial({ map: new CanvasTexture(c), color: TRAIN_ARRIVAL.headlight.color, blending: AdditiveBlending, depthWrite: false, toneMapped: false })
  }, [])

  // The model only has one door per carriage on the far side; the other openings
  // were empty (looked like open doors while moving). Fill them with mirrored
  // copies of the platform-side doors. These never open.
  useMemo(() => {
    if (scene.userData.farDoorsFilled) return
    scene.userData.farDoorsFilled = true
    const far = markers.doors.filter((d) => d.side === 'far')
    for (const d of markers.doors) {
      if (d.side !== 'platform') continue
      const src = scene.getObjectByName(d.name)
      const farX = far.map((f) => scene.getObjectByName(f.name)).find((n) => n && n.parent === src?.parent)?.position.x
      if (!src || farX === undefined) continue
      // skip the one the model already has (same place along the carriage)
      const taken = far.some((f) => {
        const n = scene.getObjectByName(f.name)
        return n && n.parent === src.parent && Math.abs(n.position.z - src.position.z) < 0.2
      })
      if (taken) continue
      const copy = src.clone()
      copy.name = `${d.name}_FarCopy`
      copy.position.x = farX
      copy.scale.x *= -1 // mirror so the outside faces out
      src.parent?.add(copy)
    }
  }, [scene])

  // Each half slides away from the middle of its door: half A one way, B the other
  const leaves = useMemo<Leaf[]>(
    () =>
      markers.doors
        .map((d) => {
          const node = scene.getObjectByName(d.name)
          if (!node) return null
          // Where it sits shut, read once from the fresh model: the model is shared, so
          // after boarding (doors still open) the ride's train would otherwise take open as shut
          const closedZ: number = (node.userData.closedZ ??= node.position.z)
          // Blender -y (half A) becomes +z in three.js after the Y-up export
          return { node, closedZ, dir: d.half === 'A' ? 1 : -1, platform: d.side === 'platform' }
        })
        .filter((l): l is Leaf => l !== null),
    [scene],
  )
  // A new train starts with its doors where the story has them (no sliding shut on arrival)
  useEffect(() => {
    const open = useGame.getState().trainDoorsOpen
    for (const l of leaves) l.node.position.z = l.closedZ + (open && l.platform ? l.dir * markers.doorSlide : 0)
  }, [leaves])

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
      // Window glass: mostly clear, so you see the tunnel from inside and the
      // carriage from the platform (the texture alone left it milky)
      if (SEE_THROUGH.includes(m.name)) {
        m.opacity = TRAIN.glassOpacity
        m.roughness = 0.2
        m.depthWrite = false
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
      } else if (trainState === 'riding') {
        g.position.z = 0
      } else if (trainState === 'stopped') {
        g.position.z = 0
        if (arrivedAt.current === null) arrivedAt.current = clock.elapsedTime
        if (clock.elapsedTime - arrivedAt.current > TRAIN_ARRIVAL.doorsAfter && !useGame.getState().trainDoorsOpen && arrivedAt.current > 0) {
          arrivedAt.current = -1 // doors open once; after that they're left to the story
          useGame.getState().setTrainDoorsOpen(true)
          playTrainDoors()
        }
      }
    }
    for (const l of lights.current) {
      if (!l) continue
      l.intensity = TRAIN.light.intensity * trainLights.level
      l.color.copy(NORMAL_COLOR).lerp(EMERGENCY_COLOR, trainLights.emergency)
    }
    for (const l of leaves) {
      const target = l.closedZ + (doorsOpen && l.platform ? l.dir * markers.doorSlide : 0)
      l.node.position.z = MathUtils.damp(l.node.position.z, target, TRAIN.doorSpeed * 3, dt)
    }
  })

  return (
    <group ref={group} visible={false}>
      <primitive object={scene} />
      {(trainState === 'arriving' || trainState === 'stopped') && (
        <>
          {/* headlights: a strong beam down the tunnel, plus spill onto the walls nearby */}
          <primitive object={head.target} />
          <spotLight
            position={head.pos.toArray()}
            target={head.target}
            color={TRAIN_ARRIVAL.headlight.color}
            intensity={TRAIN_ARRIVAL.headlight.intensity}
            distance={TRAIN_ARRIVAL.headlight.distance}
            angle={0.75}
            penumbra={0.7}
            decay={1.4}
          />
          <pointLight
            position={[head.x, head.y, head.lampZ - 1.5]}
            color={TRAIN_ARRIVAL.headlight.color}
            intensity={TRAIN_ARRIVAL.headlight.spill}
            distance={9}
            decay={2}
          />
          {[-1, 1].map((side) => (
            <sprite
              key={side}
              material={lampGlow}
              scale={TRAIN_ARRIVAL.headlight.glare}
              position={[head.x + side * TRAIN_ARRIVAL.headlight.spread, head.y, head.lampZ]}
            />
          ))}
        </>
      )}
      {/* one light per carriage keeps the game light; markers.lights has 5 per car if needed */}
      {(markers.cars as [number, number, number][]).map((c) => [c[0], c[1] + 2.25, c[2]] as [number, number, number]).map((p, i) => (
        <pointLight key={i} ref={(el) => (lights.current[i] = el)} position={p} color={TRAIN.light.color} intensity={TRAIN.light.intensity} distance={TRAIN.light.distance} decay={2} />
      ))}
    </group>
  )
}

useGLTF.preload(TRAIN_MODEL, DRACO)
