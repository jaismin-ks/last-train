import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { CanvasTexture, DoubleSide, MeshBasicMaterial, type Group, type Mesh, type MeshStandardMaterial, type Texture } from 'three'
import { DRACO } from '../data/street'
import { STATIONS } from '../data/ride'

/**
 * The station you stop at (assets-src/blender/station-stop.blend, real scale).
 * Model origin: the platform edge, at floor level, halfway along the platform.
 * The platform runs along z on the +x side (the train's door side).
 */
const STATION_MODEL = '/assets/models/station-stop.glb'

/**
 * The model's own "Jay Street-MetroTech" signs, baked into two of its
 * textures. We paint over them (black) and write our station's name in white.
 * Boxes are in pixels of the 512px maps; `flip` is how the texture stores the
 * text: 'v' upside down, 'h' mirrored, 'diag' turned on its side and mirrored.
 */
const LABELS: Record<string, { box: [number, number, number, number]; flip: 'v' | 'h' | 'diag'; size: number; bg: string }[]> = {
  // the long sign on the platform wall
  M_Posters: [{ box: [382, 212, 47, 256], flip: 'diag', size: 21, bg: '#070707' }],
  // over the stairs: the big name, and the small one by the exit
  M_Stairs: [
    { box: [294, 2, 180, 31], flip: 'v', size: 20, bg: '#0f0f0f' },
    { box: [40, 151, 64, 26], flip: 'h', size: 11, bg: '#101010' },
  ],
}
const SCALE = 2 // paint at 1024px so the new names stay crisp

/** "ELM PARK" → "Elm Park", like the signs it replaces. */
const titleCase = (name: string) => name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

/** A copy of `map` with the old station name swapped for `name`. */
function relabel(map: Texture, labels: (typeof LABELS)[string], name: string) {
  const img = map.image as CanvasImageSource & { width: number; height: number }
  const c = document.createElement('canvas')
  c.width = img.width * SCALE
  c.height = img.height * SCALE
  const g = c.getContext('2d')!
  g.drawImage(img, 0, 0, c.width, c.height)
  for (const { box, flip, size, bg } of labels) {
    const [x, y, w, h] = box.map((n) => n * SCALE)
    g.fillStyle = bg
    g.fillRect(x, y, w, h)
    // write the name the right way up in its own frame (width along the text)...
    const along = flip === 'diag' ? h : w
    const across = flip === 'diag' ? w : h
    g.save()
    // ...then map that frame onto how the texture stores it
    if (flip === 'diag') g.setTransform(0, -1, -1, 0, x + across, y + along)
    else if (flip === 'h') g.setTransform(-1, 0, 0, 1, x + along, y)
    else g.setTransform(1, 0, 0, -1, x, y + across)
    g.fillStyle = '#f2f2f2'
    g.font = `600 ${size * SCALE}px "Helvetica Neue", Helvetica, Arial, sans-serif`
    g.textBaseline = 'middle'
    g.fillText(titleCase(name), 3 * SCALE, across / 2 + SCALE, along - 6 * SCALE)
    g.restore()
  }
  const t = new CanvasTexture(c)
  t.flipY = map.flipY
  t.colorSpace = map.colorSpace
  t.wrapS = map.wrapS
  t.wrapT = map.wrapT
  t.anisotropy = 8
  return t
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

  // Our station's name on the model's own signs (the original maps are kept to repaint from)
  useEffect(() => {
    const made: Texture[] = []
    const done = new Set<MeshStandardMaterial>()
    scene.traverse((o) => {
      const m = (o as Mesh).material as MeshStandardMaterial | undefined
      const labels = m && LABELS[m.name]
      if (!(o as Mesh).isMesh || !labels || done.has(m)) return
      done.add(m)
      const original: Texture = (m.userData.originalMap ??= m.map)
      if (!original?.image) return
      m.map = relabel(original, labels, name)
      m.needsUpdate = true
      made.push(m.map)
    })
    return () => made.forEach((t) => t.dispose())
  }, [scene, name])

  useFrame(() => {
    const g = group.current
    if (!g) return
    g.visible = Math.abs(offset.current) < 160
    g.position.z = centreZ + offset.current
  })

  return (
    <group ref={group} position={[P.edgeX, P.floorY, centreZ]} visible={false}>
      <primitive object={scene} />
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
