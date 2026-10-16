import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Color, MathUtils, MeshBasicMaterial, Vector3, type Mesh, type MeshStandardMaterial } from 'three'
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
export const cctvState = { diesAt: -1 }

const yaw = MathUtils.degToRad(C.yawDeg)
const toWorld = (local: Vector3) =>
  local.clone().multiplyScalar(C.scale).applyAxisAngle(new Vector3(0, 1, 0), yaw).add(new Vector3(...C.position))

/** Where the camera is, for the story's "are you looking at it" check. */
export const CCTV_POSITION = toWorld(BODY_AT)

/** The security camera on the platform wall, with a red recording light. */
export function CCTV() {
  const { scene } = useGLTF(CCTV_MODEL, DRACO)
  const led = useMemo(() => new MeshBasicMaterial({ color: new Color(C.ledColor), toneMapped: false }), [])

  // Without reflections to show, fully metallic surfaces render nearly black
  useMemo(() => {
    scene.traverse((o) => {
      const m = (o as Mesh).material as MeshStandardMaterial | undefined
      if (!(o as Mesh).isMesh || !m?.isMeshStandardMaterial) return
      m.metalness = Math.min(m.metalness, 0.25)
    })
  }, [scene])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    let on: boolean
    if (cctvState.diesAt < 0 || t < cctvState.diesAt) on = t % C.blinkEvery < C.blinkEvery * 0.45
    else on = t - cctvState.diesAt < 0.9 && Math.random() < 0.4 // a last stutter, then nothing
    led.color.set(on ? C.ledColor : '#1a0504')
  })

  return (
    <group position={C.position} rotation={[0, yaw, 0]} scale={C.scale}>
      <primitive object={scene} />
      <mesh material={led} position={LED_AT}>
        <sphereGeometry args={[0.011, 10, 8]} />
      </mesh>
    </group>
  )
}

useGLTF.preload(CCTV_MODEL, DRACO)
