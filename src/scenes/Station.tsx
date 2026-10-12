import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { DoubleSide, Vector3, type Mesh, type MeshStandardMaterial, type PerspectiveCamera } from 'three'
import { DRACO, SCENE_FADE } from '../data/street'
import { useGame } from '../store'
import { type PresenceKind, playClang, setEscalatorVolume, setFootsteps, startStationAmbience, stopAmbience, stopEscalator, stopStationAmbience } from '../audio/sounds'
import markers from '../data/station-markers.json'
import { CAPTIONS, THOUGHTS } from '../data/captions'
import { Player, type Ride } from './Player'
import { FreeRoam, type Area } from './FreeRoam'
import { StationLights } from './StationLights'
import { EscalatorLights } from './EscalatorLights'
import { Train } from './Train'
import { PlatformLights } from './PlatformLights'
import { StreetEffects } from './StreetEffects'

const STATION_MODEL = '/assets/models/station.glb'

type V3 = [number, number, number]
/** Walking route (from Blender raycasts): hall → down the lower escalator → onto the platform. */
const FULL_ROUTE = markers.route as V3[]
/** The route stops where you step onto the platform; from there you walk freely. */
const PLATFORM_START = FULL_ROUTE.findIndex(([x]) => x <= -68)
const ROUTE = FULL_ROUTE.slice(0, PLATFORM_START + 1)
/** Where you can roam on the platform (stays off the track and behind the yellow line). */
const PLATFORM: Area = { minX: -70.3, maxX: -66.5, minZ: 24.0, maxZ: 90.0, floorY: -10.02 }
/** The barred gate that drops shut behind you once you're on the platform. */
const GATE = { name: 'LT_EntranceGate', drop: 5.2, time: 1.6 }
/** Escalator machinery hum gets louder near these points (lower escalators). */
const HUM_SOURCES = (markers.escalatorSounds as V3[]).map((p) => new Vector3(...p))
/** The lower escalator: once you step on, it carries you down by itself (m/s along the route). */
/** Heavy footsteps then a glance back at these points (0 = hall, 1 = platform end). */
const STATION_GLANCES = [0.1, 0.27, 0.45, 0.6, 0.74, 0.88]
/** What you hear before each of those glances: mostly footsteps, sometimes him. */
const STATION_GLANCE_SOUNDS: PresenceKind[] = ['steps', 'cough', 'steps', 'laugh', 'steps', 'laugh']
const ESCALATOR_RIDE: Ride = { fromX: -10.5, toX: -21.5, speed: 1.8 }
const HUM = { volume: 0.7, reach: 28 } // loudest volume, metres at which it fades out

/**
 * The subway station: you arrive in the hall and walk down to the platform.
 */
export function Station() {
  const { scene } = useGLTF(STATION_MODEL, DRACO)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const setBlackout = useGame((s) => s.setBlackout)
  const start = useRef<number | null>(null)
  const [free, setFree] = useState<{ heading: number; at: Vector3 } | null>(null)
  // Platform caption, then it clears after a while
  useEffect(() => {
    if (!free) return
    const { setCaption } = useGame.getState()
    setCaption(CAPTIONS.station.onPlatform)
    const t = setTimeout(() => setCaption(null), 7000)
    return () => clearTimeout(t)
  }, [free])
  const gate = useMemo(() => {
    const g = scene.getObjectByName(GATE.name)
    if (!g) return null
    const baseY = g.position.y
    g.visible = false // open until you're through
    return { g, baseY, start: -1, slammed: false }
  }, [scene])

  // Street sounds never carry into the station
  useEffect(() => {
    stopAmbience(300)
    setFootsteps(0)
    startStationAmbience()
    return () => {
      stopEscalator()
      stopStationAmbience()
    }
  }, [])

  // Matte imported materials (same reason as the street: no sparkly highlights)
  useEffect(() => {
    scene.traverse((o) => {
      const m = (o as Mesh).material as MeshStandardMaterial | undefined
      if (!(o as Mesh).isMesh || !m?.isMeshStandardMaterial) return
      // Fully transparent helper surfaces: invisible in Blender, but in the browser
      // they still block what's behind them (the black "hole" on the platform)
      if (m.opacity < 0.02) {
        o.visible = false
        return
      }
      // Some faces in this model point the wrong way: Blender draws both sides,
      // browsers only the front, so walls/floor vanished from some angles
      m.side = DoubleSide
      m.metalness = 0
      m.metalnessMap = null
      m.roughness = m.roughnessMap ? 1 : Math.max(m.roughness, 0.7)
    })
  }, [scene])

  useEffect(() => {
    camera.fov = 60
    camera.near = 0.05
    camera.far = 400
    camera.updateProjectionMatrix()
  }, [camera])

  useFrame(({ clock }) => {
    // Fade in from black
    if (start.current === null) start.current = clock.elapsedTime
    const fade = Math.min(1, (clock.elapsedTime - start.current) / SCENE_FADE.in)
    setBlackout(1 - fade * fade * (3 - 2 * fade)) // smooth fade in from black
    // Escalator hum: louder the closer you are to a running escalator
    const d = Math.min(...HUM_SOURCES.map((p) => p.distanceTo(camera.position)))
    const k = Math.max(0, 1 - d / HUM.reach)
    setEscalatorVolume(HUM.volume * k * k * fade)

    // The gate slams down behind you once you're on the platform
    if (free && gate) {
      if (gate.start < 0) gate.start = clock.elapsedTime
      const t = Math.min(1, (clock.elapsedTime - gate.start) / GATE.time)
      const fall = t * t // accelerates as it drops
      gate.g.visible = true
      gate.g.position.y = gate.baseY + GATE.drop * (1 - fall)
      if (t >= 1 && !gate.slammed) {
        gate.slammed = true
        playClang()
        setTimeout(() => useGame.getState().setThought(THOUGHTS.gateClosed), 900)
      }
    }
  })

  return (
    <>
      <color attach="background" args={['#010403']} />
      <fog attach="fog" args={['#03110b', 5, 55]} />
      {/* Faint green fill so the darkness between lights isn't pure black */}
      <hemisphereLight args={['#2f6b4f', '#050807', 0.9]} />
      <StationLights route={ROUTE} />
      <EscalatorLights />
      <PlatformLights />
      {/* Parked for now; arrival comes later */}
      <Train />
      <primitive object={scene} />
      {!free && (
        <Player
          route={ROUTE}
          ride={ESCALATOR_RIDE}
          glances={STATION_GLANCES}
          glanceSounds={STATION_GLANCE_SOUNDS}
          onArrive={(heading) => setFree({ heading, at: camera.position.clone() })}
        />
      )}
      {free && <FreeRoam area={PLATFORM} collide={scene} start={free.at} startHeading={free.heading} />}
      <StreetEffects />
    </>
  )
}

useGLTF.preload(STATION_MODEL, DRACO)
