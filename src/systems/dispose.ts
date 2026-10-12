import type { Material, Mesh, Object3D, Texture } from 'three'

/** Frees the GPU memory (geometry, materials, textures) used by an object tree. */
export function disposeTree(root: Object3D) {
  const textures = new Set<Texture>()
  root.traverse((o) => {
    const mesh = o as Mesh
    if (!mesh.isMesh) return
    mesh.geometry?.dispose()
    const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as Material[]
    for (const m of mats) {
      if (!m) continue
      for (const v of Object.values(m)) if (v && (v as Texture).isTexture) textures.add(v as Texture)
      m.dispose()
    }
  })
  textures.forEach((t) => t.dispose())
}
