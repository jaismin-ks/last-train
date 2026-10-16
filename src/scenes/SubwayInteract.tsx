import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { SCENE_FADE, SUBWAY_ENTRANCE } from '../data/street'
import { useGame } from '../store'
import { setFootsteps, stopAmbience } from '../audio/sounds'

/**
 * Reaching the subway entrance fades the street to black (the street ambience
 * fades out with it), then the station fades in from black.
 */
export function SubwayInteract({ onEnter }: { onEnter: () => void }) {
  const camera = useThree((s) => s.camera)
  const setBlackout = useGame((s) => s.setBlackout)
  const setPhase = useGame((s) => s.setPhase)
  const leaving = useRef<number | null>(null) // time the fade started

  useFrame(({ clock }) => {
    if (leaving.current !== null) {
      const k = Math.min(1, (clock.elapsedTime - leaving.current) / SCENE_FADE.out)
      setBlackout(k * k * (3 - 2 * k)) // smooth ease to black
      if (k >= 1) setPhase('platform')
      return
    }
    const d = Math.hypot(camera.position.x - SUBWAY_ENTRANCE.x, camera.position.z - SUBWAY_ENTRANCE.z)
    if (d >= SUBWAY_ENTRANCE.radius) return
    leaving.current = clock.elapsedTime
    onEnter() // stops the player walking
    useGame.getState().setCountdown(null) // made it in time
    setFootsteps(0)
    stopAmbience(SCENE_FADE.out * 1000)
  })

  return null
}
