import { useMemo } from 'react'
import { Box3, MeshStandardMaterial, Vector3, type Mesh, type MeshStandardMaterial as Std, type Object3D } from 'three'
import { PooledLight } from './LightPool'

/**
 * The station model has a pair of red signal lamps (Base_154m_0) hanging near
 * the platform ceiling with nothing around them: two red discs floating in the
 * air. This gives them a dark housing, a rod up to the ceiling, a brighter glow
 * and a little red light, so they read as a real signal.
 */
const SIGNAL = {
  mesh: 'Base_154m_0',
  ceilingY: -4.2, // rod goes up into the ceiling (-4.33)
  glow: 2.2, // emissive strength of the lamps
  light: { color: '#ff2a1a', intensity: 0.8, distance: 3 },
  housingColor: '#151716',
}

export function SignalLamp({ scene }: { scene: Object3D }) {
  const lamp = useMemo(() => {
    const mesh = scene.getObjectByName(SIGNAL.mesh) as Mesh | undefined
    if (!mesh) return null
    const m = mesh.material as Std
    if (m.emissive) m.emissiveIntensity = SIGNAL.glow
    const box = new Box3().setFromObject(mesh)
    const size = box.getSize(new Vector3())
    const centre = box.getCenter(new Vector3())
    // the thin side of the lamps is the way they face
    const thin = size.x < size.z ? 'x' : 'z'
    return { size, centre, thin, top: box.max.y }
  }, [scene])
  const housing = useMemo(() => new MeshStandardMaterial({ color: SIGNAL.housingColor, roughness: 0.6, metalness: 0.3 }), [])
  if (!lamp) return null

  const { size, centre, thin, top } = lamp
  // a backing plate slightly bigger than the lamps and thinner than them, so the lenses show on both faces
  const plate: [number, number, number] =
    thin === 'z' ? [size.x + 0.08, size.y + 0.1, Math.max(0.02, size.z * 0.6)] : [Math.max(0.02, size.x * 0.6), size.y + 0.1, size.z + 0.08]
  const rod = SIGNAL.ceilingY - (top + 0.05)
  return (
    <group position={centre.toArray()}>
      <mesh material={housing}>
        <boxGeometry args={plate} />
      </mesh>
      {/* hood over the top lamp */}
      <mesh material={housing} position={[0, size.y / 2 + 0.06, 0]}>
        <boxGeometry args={[plate[0] + 0.02, 0.03, plate[2] + 0.12]} />
      </mesh>
      <mesh material={housing} position={[0, size.y / 2 + 0.05 + rod / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, rod, 8]} />
      </mesh>
      <PooledLight color={SIGNAL.light.color} intensity={SIGNAL.light.intensity} distance={SIGNAL.light.distance} decay={2} />
    </group>
  )
}
