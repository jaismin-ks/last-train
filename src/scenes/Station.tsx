import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Vector3, type Mesh, type MeshStandardMaterial, type PerspectiveCamera } from 'three'
import { DRACO, SCENE_FADE } from '../data/street'
import { useGame } from '../store'
import { setEscalatorVolume, setFootsteps, startStationAmbience, stopAmbience, stopEscalator, stopStationAmbience } from '../audio/sounds'
import markers from '../data/station-markers.json'
import { Player, type Ride } from './Player'
import { StationLights } from './StationLights'
import { StreetEffects } from './StreetEffects'

const STATION_MODEL = '/assets/models/station.glb'

type V3 = [number, number, number]
/** Walking route (from Blender raycasts): hall → down the lower escalator → platform. */
const ROUTE = markers.route as V3[]
/** Escalator machinery hum gets louder near these points (lower escalators). */
const HUM_SOURCES = (markers.escalatorSounds as V3[]).map((p) => new Vector3(...p))
/** The lower escalator: once you step on, it carries you down by itself (m/s along the route). */
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
      if (m.transparent && m.opacity < 0.02) {
        o.visible = false
        return
      }
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
    setBlackout(1 - fade)
    // Escalator hum: louder the closer you are to a running escalator
    const d = Math.min(...HUM_SOURCES.map((p) => p.distanceTo(camera.position)))
    const k = Math.max(0, 1 - d / HUM.reach)
    setEscalatorVolume(HUM.volume * k * k * fade)
  })

  return (
    <>
      <color attach="background" args={['#010403']} />
      <fog attach="fog" args={['#03110b', 5, 55]} />
      {/* Faint green fill so the darkness between lights isn't pure black */}
      <hemisphereLight args={['#2f6b4f', '#050807', 0.9]} />
      <StationLights route={ROUTE} />
      <primitive object={scene} />
      <Player route={ROUTE} ride={ESCALATOR_RIDE} />
      <StreetEffects />
    </>
  )
}

useGLTF.preload(STATION_MODEL, DRACO)
