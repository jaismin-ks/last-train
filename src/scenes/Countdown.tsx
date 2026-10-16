import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGame } from '../store'
import { setFootsteps, setHeartbeat } from '../audio/sounds'

/**
 * Runs the "catch the train" countdown while mounted (game time, so it stops
 * while paused). The scene ends it early with setCountdown(null) when you make
 * it; if it reaches zero, you've missed the train.
 */
export function Countdown({ seconds, label, missed }: { seconds: number; label: string; missed: string }) {
  const left = useRef(seconds)

  useEffect(() => {
    useGame.getState().startCountdown(seconds, label, missed)
    return () => useGame.getState().setCountdown(null)
  }, [seconds, label, missed])

  useFrame((_, dt) => {
    const g = useGame.getState()
    if (g.countdown === null || g.missed) return
    left.current = Math.max(0, left.current - Math.min(dt, 0.1))
    const shown = Math.ceil(left.current * 10) / 10 // tenths, so the UI only updates 10× a second
    if (shown !== g.countdown) g.setCountdown(shown)
    if (left.current <= 0) {
      g.setMissed(true)
      g.setInputLocked(true)
      setFootsteps(0)
      setHeartbeat(false)
    }
  })

  return null
}
