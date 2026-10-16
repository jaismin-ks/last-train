import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { CanvasTexture, DoubleSide, MeshBasicMaterial, type Group, type Mesh, type MeshStandardMaterial } from 'three'
import { DRACO } from '../data/street'
import { STATIONS } from '../data/ride'

/**
 * The station you stop at (assets-src/blender/station-stop.blend, real scale).
 * Model origin: the platform edge, at floor level, halfway along the platform.
 * The platform runs along z on the +x side (the train's door side).
 */
const STATION_MODEL = '/assets/models/station-stop.glb'

/** Station name sign, drawn once on a canvas. */
function signTexture(name: string) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 160
  const g = c.getContext('2d')!
  g.fillStyle = STATIONS.colors.trim
  g.fillRect(0, 0, c.width, c.height)
  g.fillStyle = '#f2f4f3'
  g.font = '600 96px "IBM Plex Mono", monospace'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(name, c.width / 2, c.height / 2 + 4)
  return new CanvasTexture(c)
}

/**
 * A station platform beside the train doors. `offset` (metres along the
 * track, read every frame) slides it in as the train arrives and away as it
 * leaves; it's hidden when far off.
 */
export function StationStop({ name, offset, centreZ }: { name: string; offset: { current: number }; centreZ: number }) {
  const { scene } = useGLTF(STATION_MODEL, DRACO)
  const group = useRef<Group>(null)
  const P = STATIONS.model
  const sign = useMemo(() => new MeshBasicMaterial({ map: signTexture(name), toneMapped: false }), [name])
  const tube = useMemo(() => new MeshBasicMaterial({ color: STATIONS.colors.light, toneMapped: false }), [])

  // Matte, and both sides drawn (some faces in the model point the wrong way)
  useEffect(() => {
    scene.traverse((o) => {
      const m = (o as Mesh).material as MeshStandardMaterial | undefined
      if (!(o as Mesh).isMesh || !m?.isMeshStandardMaterial) return
      m.side = DoubleSide
      m.metalness = 0
      m.metalnessMap = null
      m.roughness = Math.max(m.roughness, 0.75)
    })
  }, [scene])
  useEffect(() => () => sign.map?.dispose(), [sign])

  useFrame(() => {
    const g = group.current
    if (!g) return
    g.visible = Math.abs(offset.current) < 160
    g.position.z = centreZ + offset.current
  })

  return (
    <group ref={group} position={[P.edgeX, P.floorY, centreZ]} visible={false}>
      <primitive object={scene} />
      {/* our station names along the back wall */}
      {P.signs.map((z) => (
        <mesh key={z} material={sign} position={[P.wallX - 0.04, 2.0, z]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[2.6, 0.4]} />
        </mesh>
      ))}
      {/* fluorescent tubes under the ceiling, and their light */}
      {P.lights.map((z) => (
        <group key={z} position={[P.lightX, P.lightY, z]}>
          <mesh material={tube}>
            <boxGeometry args={[0.08, 0.04, 1.3]} />
          </mesh>
          <pointLight color={STATIONS.colors.light} intensity={P.lightIntensity} distance={10} decay={2} />
        </group>
      ))}
    </group>
  )
}

useGLTF.preload(STATION_MODEL, DRACO)
