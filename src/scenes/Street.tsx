import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import type { Mesh, MeshStandardMaterial } from 'three'
import { DRACO, LAMP_LIGHT, LAMP_MATERIAL, LAMPS, STREET_MODEL, SUBWAY_LIGHTS } from '../data/street'

/** Helper objects from the Blender file (e.g. the box that cuts the stairwell hole). */
const HIDDEN_OBJECTS = ['LT_SubwayHoleCutter']

/** Lowest roughness allowed on imported materials (stops sparkly highlights). */
const MIN_ROUGHNESS = 0.75

/** Road and sidewalk materials keep their own roughness (the wet road should shine). */
const GROUND_MATERIALS = ['8k Wet road with puddles', 'Asphalt Ground with crack']

/** Materials whose normal maps use the DirectX convention (green channel flipped). */
const DIRECTX_NORMALS = ['Asphalt Ground with crack']

/**
 * The street set exported from Blender (optimised with gltf-transform),
 * plus a point light in every street lamp and the subway entrance globes.
 * `brightness` (0–1) lets cutscenes fade the lamps in.
 */
export function Street({ brightness = 1 }: { brightness?: number }) {
  const { scene } = useGLTF(STREET_MODEL, DRACO)

  // Blender helper objects that should never render, even if they get exported
  useEffect(() => {
    for (const name of HIDDEN_OBJECTS) {
      const o = scene.getObjectByName(name)
      if (o) o.visible = false
    }
  }, [scene])

  // Imported building/prop materials are often shiny or metallic, which makes
  // lamp highlights sparkle on their normal maps. Make them matte like real
  // brick and concrete. Road/sidewalk materials keep their sheen.
  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as MeshStandardMaterial[]
      for (const m of mats) {
        if (!m.isMeshStandardMaterial) continue
        // Normal maps authored in DirectX convention: flip green for three.js (OpenGL)
        if (DIRECTX_NORMALS.includes(m.name)) m.normalScale.y = -Math.abs(m.normalScale.y)
        if (m.name.startsWith('LT_') || GROUND_MATERIALS.includes(m.name)) continue
        m.metalness = 0
        m.metalnessMap = null
        m.roughness = m.roughnessMap ? 1 : Math.max(m.roughness, MIN_ROUGHNESS)
        m.needsUpdate = true
      }
    })
  }, [scene])

  // Make the lamp glass glow
  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as MeshStandardMaterial
      if (mat.name === LAMP_MATERIAL) {
        mat.emissive.set(LAMP_LIGHT.color) // glass matches the light colour
        mat.emissiveIntensity = LAMP_LIGHT.glassGlow * brightness
      }
      const globe = SUBWAY_LIGHTS.globes[mat.name]
      if (globe) {
        mat.emissive.set(globe.color)
        mat.emissiveIntensity = globe.glow * brightness
      }
    })
  }, [scene, brightness])

  return (
    <>
      <primitive object={scene} />
      {LAMPS.map((pos, i) => (
        <pointLight
          key={i}
          position={pos}
          color={LAMP_LIGHT.color}
          intensity={LAMP_LIGHT.intensity * brightness}
          distance={LAMP_LIGHT.distance}
          decay={2}
        />
      ))}
      {SUBWAY_LIGHTS.positions.map((pos, i) => (
        <pointLight
          key={`subway-${i}`}
          position={pos}
          color={SUBWAY_LIGHTS.color}
          intensity={SUBWAY_LIGHTS.intensity * brightness}
          distance={SUBWAY_LIGHTS.distance}
          decay={2}
        />
      ))}
    </>
  )
}

useGLTF.preload(STREET_MODEL, DRACO)
