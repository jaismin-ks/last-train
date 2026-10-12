import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { Box3, BufferAttribute, MeshBasicMaterial, type Mesh, type Texture } from 'three'
import { SCREEN_H, SCREEN_W } from '../data/phoneScreens'

const MODEL = '/assets/models/iphone.glb'
const DRACO = '/draco/' // decoder copied from three/examples, served locally
// Model units → metres, so the phone is ~14.7 cm tall like a real iPhone
const SCALE = 0.01

export type ScreenPointer = { x: number; y: number } // Figma px, origin top-left

type Props = {
  screen: Texture
  onScreenDown?: (p: ScreenPointer) => void
  onScreenMove?: (p: ScreenPointer) => void
  onScreenUp?: (p: ScreenPointer) => void
}

/**
 * iPhone model with `screen` drawn on its own rounded "screen" mesh.
 * The model's UVs only cover part of the texture, so they are rebuilt
 * from the mesh bounds to map the image edge to edge.
 */
export function Phone({ screen, onScreenDown, onScreenMove, onScreenUp }: Props) {
  const { scene } = useGLTF(MODEL, DRACO)
  const material = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), [])

  useEffect(() => {
    const mesh = scene.getObjectByName('screen') as Mesh | undefined
    if (!mesh) return
    const geo = mesh.geometry
    if (!geo.userData.uvRebuilt) {
      const box = new Box3().setFromBufferAttribute(geo.attributes.position as BufferAttribute)
      const pos = geo.attributes.position
      const uv = new Float32Array(pos.count * 2)
      for (let i = 0; i < pos.count; i++) {
        uv[i * 2] = (pos.getX(i) - box.min.x) / (box.max.x - box.min.x)
        uv[i * 2 + 1] = (pos.getY(i) - box.min.y) / (box.max.y - box.min.y)
      }
      geo.setAttribute('uv', new BufferAttribute(uv, 2))
      geo.userData.uvRebuilt = true
    }
    mesh.material = material
  }, [scene, material])

  useEffect(() => {
    material.map = screen
    material.needsUpdate = true
  }, [material, screen])

  // Convert a hit on the screen mesh into Figma pixel coordinates
  const toScreen = (e: ThreeEvent<PointerEvent>): ScreenPointer | null => {
    if (e.object.name !== 'screen' || !e.uv) return null
    return { x: e.uv.x * SCREEN_W, y: (1 - e.uv.y) * SCREEN_H }
  }
  const handle = (fn?: (p: ScreenPointer) => void) => (e: ThreeEvent<PointerEvent>) => {
    const p = toScreen(e)
    if (p && fn) {
      e.stopPropagation()
      fn(p)
    }
  }

  return (
    <group scale={SCALE}>
      <primitive
        object={scene}
        onPointerDown={handle(onScreenDown)}
        onPointerMove={handle(onScreenMove)}
        onPointerUp={handle(onScreenUp)}
      />
    </group>
  )
}

useGLTF.preload(MODEL, DRACO)
