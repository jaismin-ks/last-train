import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  MathUtils,
  MeshBasicMaterial,
  SpriteMaterial,
  Vector3,
  type Mesh,
  type MeshStandardMaterial,
  type PointLight,
} from 'three'
import { DRACO } from '../data/street'
import { CCTV as C } from '../data/platform'

const CCTV_MODEL = '/assets/models/cctv.glb'

/**
 * Model layout (assets-src/blender/cctv.blend): origin on the wall plate, lens
 * pointing along -x. The red light sits on the front face beside the lens.
 */
const LED_AT = new Vector3(-0.459, 0.099, -0.071)
/** Roughly the middle of the camera body, for "are you looking at it". */
const BODY_AT = new Vector3(-0.28, 0.06, -0.03)

/**
 * State the story drives: the LED blinks red until `diesAt` (clock time),
 * then stutters and goes dark for good.
 */
export const cctvState = { diesAt: -1, dead: false }

const yaw = MathUtils.degToRad(C.yawDeg)
const toWorld = (local: Vector3) =>
  local.clone().multiplyScalar(C.scale).applyAxisAngle(new Vector3(0, 1, 0), yaw).add(new Vector3(...C.position))

/** Where the camera is, for the story's "are you looking at it" check. */
export const CCTV_POSITION = toWorld(BODY_AT)
/** Which way the lens points, flat (for "can it see you"). */
export const CCTV_FORWARD = new Vector3(-1, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), yaw)

/** Soft round glow (drawn once on a small canvas). */
function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.18, 'rgba(255,255,255,0.6)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return new CanvasTexture(c)
}

/** The security camera on the platform wall, with a red recording light. */
export function CCTV() {
  const { scene } = useGLTF(CCTV_MODEL, DRACO)
  const led = useMemo(() => new MeshBasicMaterial({ color: new Color(C.ledColor), toneMapped: false, fog: false }), [])
  const glow = useMemo(
    () =>
      new SpriteMaterial({
        map: glowTexture(),
        color: new Color(C.ledColor),
        blending: AdditiveBlending,
        depthWrite: false,
        fog: false, // stays visible from down the platform
        toneMapped: false,
      }),
    [],
  )
  const light = useRef<PointLight>(null)

  // Without reflections to show, fully metallic surfaces render nearly black
  useMemo(() => {
    scene.traverse((o) => {
      const m = (o as Mesh).material as MeshStandardMaterial | undefined
      if (!(o as Mesh).isMesh || !m?.isMeshStandardMaterial) return
      m.metalness = Math.min(m.metalness, 0.25)
    })
  }, [scene])

  const stutter = useRef(0) // seconds since it died (a last stutter, then nothing)
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    let on: boolean
    if (!cctvState.dead) {
      stutter.current = 0
      on = t % C.blinkEvery < C.blinkEvery * 0.6
    } else {
      stutter.current += dt
      on = stutter.current < 0.9 && Math.random() < 0.4
    }
    led.color.set(on ? C.ledColor : '#1a0504')
    glow.opacity = on ? C.glowStrength : 0
    if (light.current) light.current.intensity = on ? C.lightIntensity : 0
  })

  return (
    <group position={C.position} rotation={[0, yaw, 0]} scale={C.scale}>
      <primitive object={scene} />
      <group position={LED_AT}>
        <mesh material={led}>
          <sphereGeometry args={[0.018, 10, 8]} />
        </mesh>
        <sprite material={glow} scale={C.glowSize / C.scale} position={[-0.03, 0, 0]} />
        <pointLight ref={light} position={[-0.12, 0, 0]} color={C.ledColor} intensity={C.lightIntensity} distance={2.5} decay={2} />
      </group>
    </group>
  )
}

useGLTF.preload(CCTV_MODEL, DRACO)
