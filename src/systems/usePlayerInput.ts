import { useEffect, useRef } from 'react'
import { MathUtils } from 'three'

export type PlayerInput = {
  forward: boolean
  back: boolean
  run: boolean // Shift held
  /** Mouse position, -1 (left / bottom) to 1 (right / top) */
  lookX: number
  lookY: number
}

const FORWARD = ['KeyW', 'ArrowUp']
const BACK = ['KeyS', 'ArrowDown']

/**
 * Keyboard + mouse state for walking. Read it every frame from the ref;
 * nothing re-renders when keys change.
 */
export function usePlayerInput(enabled: boolean) {
  const input = useRef<PlayerInput>({ forward: false, back: false, run: false, lookX: 0, lookY: 0 })

  useEffect(() => {
    if (!enabled) return
    const i = input.current
    const key = (down: boolean) => (e: KeyboardEvent) => {
      if (FORWARD.includes(e.code)) i.forward = down
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') i.run = down
      if (BACK.includes(e.code)) i.back = down
    }
    const onDown = key(true)
    const onUp = key(false)
    const onMove = (e: MouseEvent) => {
      i.lookX = (e.clientX / window.innerWidth) * 2 - 1
      i.lookY = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    // Cursor left the window: ease the look back toward the middle so you
    // don't keep spinning on the platform
    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget) return
      i.lookX = MathUtils.clamp(i.lookX, -0.55, 0.55)
    }
    // Stop walking if the window loses focus mid-step
    const onBlur = () => {
      i.forward = false
      i.run = false
      i.back = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseout', onLeave)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseout', onLeave)
      window.removeEventListener('blur', onBlur)
    }
  }, [enabled])

  return input
}
