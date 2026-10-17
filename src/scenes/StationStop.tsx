import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { CanvasTexture, DoubleSide, MeshBasicMaterial, type Group, type Mesh, type MeshStandardMaterial, type PointLight, type Texture } from 'three'
import { DRACO } from '../data/street'
import { STATIONS } from '../data/ride'

/**
 * The station you stop at (assets-src/blender/station-stop.blend, real scale).
 * Model origin: the platform edge, at floor level, halfway along the platform.
 * The platform runs along z on the +x side (the train's door side).
 */
const STATION_MODEL = '/assets/models/station-stop.glb'

/**
 * The model's own New York signs ("Jay Street-MetroTech" and its exits), baked
 * into two of its textures. We paint over them (black) and write our station's
 * name in white, or `text` (lines, top to bottom) where it's a direction sign.
 * Boxes are in pixels of the 512px maps; `flip` is how the texture stores the
 * text: 'v' upside down, 'h' mirrored, 'diag' turned on its side and mirrored.
 */
type Label = { box: [number, number, number, number]; flip: 'v' | 'h' | 'diag'; size: number; bg: string; text?: string[] }
const LABELS: Record<string, Label[]> = {
  // the long sign on the platform wall
  M_Posters: [{ box: [382, 212, 47, 256], flip: 'diag', size: 21, bg: '#070707' }],
  // over the stairs: the big name, and the small one by the exit
  M_Stairs: [
    { box: [294, 2, 180, 31], flip: 'v', size: 20, bg: '#0f0f0f' },
    { box: [40, 151, 64, 26], flip: 'h', size: 11, bg: '#101010' },
    // the exit directions beside the arrows (were "Manhattan & Queens", "Willoughby St & Jay St / 24 hour booth")
    { box: [178, 40, 92, 20], flip: 'v', size: 8, bg: '#101010', text: ['All trains'] },
    { box: [304, 41, 92, 19], flip: 'v', size: 7, bg: '#0f0f0f', text: ['Delmont St. W', '24 hour booth'] },
  ],
}
const SCALE = 2 // paint at 1024px so the new names stay crisp

/** "ELM PARK" → "Elm Park", like the signs it replaces. */
const titleCase = (name: string) => name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

/** A copy of `map` with the old station name swapped for `name`. */
function relabel(map: Texture, labels: Label[], name: string) {
  const img = map.image as CanvasImageSource & { width: number; height: number }
  const c = document.createElement('canvas')
  c.width = img.width * SCALE
  c.height = img.height * SCALE
  const g = c.getContext('2d')!
  g.drawImage(img, 0, 0, c.width, c.height)
  for (const { box, flip, size, bg, text } of labels) {
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
    const lines = text ?? [titleCase(name)]
    const lineHeight = across / lines.length
    lines.forEach((line, i) => g.fillText(line, 3 * SCALE, lineHeight * (i + 0.5) + SCALE, along - 6 * SCALE))
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
export function StationStop({
  name,
  offset,
  centreZ,
  police,
}: {
  name: string
  offset: { current: number }
  centreZ: number
  /** The alarm station: police lights flash on the platform and its tubes burn low. */
  police: { current: boolean }
}) {
  const { scene } = useGLTF(STATION_MODEL, DRACO)
  const group = useRef<Group>(null)
  const tubeLights = useRef<(PointLight | null)[]>([])
  const flashes = useRef<(PointLight | null)[]>([])
  const C = STATIONS.police
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

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    g.visible = Math.abs(offset.current) < 160
    g.position.z = centreZ + offset.current
    const on = police.current
    for (const l of tubeLights.current) if (l) l.intensity = P.lightIntensity * (on ? C.tubes : 1)
    // red and blue, alternating, a little out of step along the platform
    flashes.current.forEach((l, i) => {
      if (!l) return
      const phase = clock.elapsedTime * C.flashesPerSecond + i * 0.37
      l.color.set(C.colors[Math.floor(phase) % 2])
      l.intensity = on ? C.intensity * Math.pow(Math.abs(Math.sin(phase * Math.PI)), 2) : 0
    })
  })

  return (
    <group ref={group} position={[P.edgeX, P.floorY, centreZ]} visible={false}>
      <primitive object={scene} />
      {/* fluorescent tubes under the ceiling, and their light */}
      {P.lights.map((z, i) => (
        <group key={z} position={[P.lightX, P.lightY, z]}>
          <mesh material={tube}>
            <boxGeometry args={[0.08, 0.04, 1.3]} />
          </mesh>
          <pointLight ref={(l) => void (tubeLights.current[i] = l)} color={STATIONS.colors.light} intensity={P.lightIntensity} distance={10} decay={2} />
        </group>
      ))}
      {/* police lights (only lit at the alarm station) */}
      {C.at.map((z, i) => (
        <pointLight key={z} ref={(l) => void (flashes.current[i] = l)} position={[C.x, C.y, z]} intensity={0} distance={C.distance} decay={2} />
      ))}
    </group>
  )
}

useGLTF.preload(STATION_MODEL, DRACO)
