import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { SCENE_FADE, SUBWAY_ENTRANCE } from '../data/street'
import { useGame } from '../store'
import { setFootsteps, stopAmbience } from '../audio/sounds'

const PROMPT = 'Press E to enter'

/**
 * Shows "Press E to enter" near the subway entrance. Pressing E fades the
 * street to black and moves on to the platform scene.
 */
export function SubwayInteract({ onEnter }: { onEnter: () => void }) {
  const camera = useThree((s) => s.camera)
  const setPrompt = useGame((s) => s.setPrompt)
  const setBlackout = useGame((s) => s.setBlackout)
  const setPhase = useGame((s) => s.setPhase)
  const near = useRef(false)
  const leaving = useRef<number | null>(null) // time the fade started

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || !near.current || leaving.current !== null) return
      leaving.current = -1 // start on the next frame
      setPrompt(null)
      setFootsteps(0)
      stopAmbience(SCENE_FADE.out * 1000)
      onEnter()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      setPrompt(null)
    }
  }, [onEnter, setPrompt])

  useFrame(({ clock }) => {
    if (leaving.current !== null) {
      if (leaving.current < 0) leaving.current = clock.elapsedTime
      const k = Math.min(1, (clock.elapsedTime - leaving.current) / SCENE_FADE.out)
      setBlackout(k)
      if (k >= 1) setPhase('platform')
      return
    }
    const d = Math.hypot(camera.position.x - SUBWAY_ENTRANCE.x, camera.position.z - SUBWAY_ENTRANCE.z)
    const isNear = d < SUBWAY_ENTRANCE.radius
    if (isNear !== near.current) {
      near.current = isNear
      setPrompt(isNear ? PROMPT : null)
    }
  })

  return null
}
