import { useEffect, useRef, useState } from 'react'
import { Preload } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Fog, MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { DESCENT, EYE_HEIGHT, FOG, NIGHT_LIGHT, PLAYER_START, STREET_ROUTE, COUNTDOWN } from '../data/street'
import { useGame } from '../store'
import { fitFov } from '../systems/device'
import { NightSky } from './NightSky'
import { SkyHaze } from './SkyHaze'
import { Street } from './Street'
import { Player } from './Player'
import { Countdown } from './Countdown'
import { StreetEffects } from './StreetEffects'
import { startAmbience } from '../audio/sounds'

/** Street-level fog; the descent starts thicker and eases to this. */

const BLACK = new Color('#000000')
const FOG_COLOR = new Color(FOG.color)

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // easeInOutCubic

/**
 * Mounted from the start of the phone scene so the street's materials and
 * lights are compiled early (the phone camera sits far below, inside the
 * black fog, so none of it is visible). When the phase becomes 'descent': the starry sky fades in while the camera looks up,
 * then the camera drops from high above the city to eye level and
 * tilts down to face up the street. Hands over to 'street' when done.
 */
export function Descent() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const aspect = useThree((s) => s.size.width / s.size.height)
  const setPhase = useGame((s) => s.setPhase)

  const phase = useGame((s) => s.phase)
  const start = useRef<number | null>(null)
  const [sky, setSky] = useState(phase === 'street' ? 1 : 0)
  const target = useRef(new Vector3())
  const fog = useRef<Fog>(null)

  const running = phase === 'descent' || phase === 'street'

  // Outside ambience comes in once the phone has faded out
  useEffect(() => {
    if (running) startAmbience()
  }, [running])

  // Switch from the phone close-up lens to the city lens when the descent starts
  useEffect(() => {
    if (!running) return
    camera.fov = fitFov(60, aspect)
    camera.near = 0.05
    camera.far = 500
    camera.updateProjectionMatrix()
  }, [camera, running, aspect])

  useFrame(({ clock }) => {
    if (phase !== 'descent') return
    if (start.current === null) start.current = clock.elapsedTime
    const t = clock.elapsedTime - start.current
    const { skyFade, hold, drop, startHeight, startPitchDeg, tiltStart } = DESCENT

    // Stars fade in from black
    setSky(ease(Math.min(1, t / skyFade)))

    // 0 while fading in + holding on the stars, then 0 → 1 over the drop
    const p = ease(MathUtils.clamp((t - skyFade - hold) / drop, 0, 1))
    const height = MathUtils.lerp(startHeight, EYE_HEIGHT, p)
    // Straight down onto the start point
    const x = PLAYER_START.x
    const z = PLAYER_START.z

    // Thick fog up high hides the edges of the ground; it clears near the street
    if (fog.current) {
      fog.current.near = MathUtils.lerp(4, FOG.near, p)
      fog.current.far = MathUtils.lerp(30, FOG.far, p)
      // Pure black up high so fogged buildings vanish into the night sky
      fog.current.color.copy(BLACK).lerp(FOG_COLOR, p)
    }
    // Keep looking up while above the roofs, then tilt down to the street
    const raw = MathUtils.clamp((t - skyFade - hold) / drop, 0, 1)
    const tilt = ease(MathUtils.clamp((raw - tiltStart) / (1 - tiltStart), 0, 1))
    const pitch = MathUtils.degToRad(MathUtils.lerp(startPitchDeg, 0, tilt))

    camera.position.set(x, height, z)
    target.current.set(
      x + PLAYER_START.dirX * 10,
      height + Math.tan(pitch) * 10,
      z + PLAYER_START.dirZ * 10,
    )
    camera.lookAt(target.current)

    if (t >= skyFade + hold + drop) setPhase('street')
  })

  return (
    <>
      <NightSky intensity={sky} />
      <Preload all />
      <SkyHaze opacity={sky} />
      {/* Placeholder night lighting until lamps and windows are lit */}
      <hemisphereLight args={[NIGHT_LIGHT.skyColor, NIGHT_LIGHT.groundColor, NIGHT_LIGHT.sky * sky]} />
      <directionalLight position={NIGHT_LIGHT.moonPosition} intensity={NIGHT_LIGHT.moon * sky} color={NIGHT_LIGHT.moonColor} />
      {/* Close, dark fog hides the edge of the ground beyond the block */}
      <fog
        ref={fog}
        attach="fog"
        args={phase === 'street' ? [FOG.color, FOG.near, FOG.far] : ['#000000', 4, 30]}
      />
      {/* Lamps stay on even while hidden, so their shaders are ready (no hitch) */}
      <Street brightness={running ? Math.max(sky, 0.001) : 1} />
      {phase === 'street' && <Player route={STREET_ROUTE} street />}
      {phase === 'street' && <Countdown {...COUNTDOWN.street} />}
      {running && <StreetEffects />}
    </>
  )
}
