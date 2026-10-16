import { useGame } from '../store'
import { FEAR } from '../data/fear'
import { setHeartbeatRate, setMuffle } from '../audio/sounds'

const state = { panicUntil: 0, calmUntil: 0, lastMuffle: -1 }

/** Where he is (his eyes), so a panic can drag your gaze to him. Set by the scene each frame. */
export const fearFocus = { active: false, x: 0, y: 0, z: 0 }

/**
 * Steps the fear level for one frame (see data/fear.ts). Returns 'panic' on the
 * frame you freeze up, so the scene can bring him closer while you can't move.
 *   dist     metres to him (Infinity when he isn't there / hasn't shown himself)
 *   inView   he's on screen
 *   calm     you're somewhere safe (the bright light, the working camera)
 */
export function stepFear(now: number, dt: number, dist: number, inView: boolean, calm: boolean): 'panic' | null {
  const g = useGame.getState()
  if (g.missed) return null
  let stress = g.stress
  let event: 'panic' | null = null

  if (g.panic) {
    if (now >= state.panicUntil) {
      g.setPanic(false)
      stress = FEAR.afterPanic
      state.calmUntil = now + FEAR.panicCooldown // can't panic again straight away
    }
  } else {
    const near = dist < FEAR.range ? 1 - dist / FEAR.range : 0
    let rate = FEAR.rise * near * near + (inView && near > 0 ? FEAR.lookRise : 0)
    if (calm) rate = -FEAR.calmFall
    else if (near === 0) rate = -FEAR.fall
    // fear only colours the screen and sound; freezing comes from getting too close
    stress = Math.min(0.95, Math.max(0, stress + rate * dt))
    if (dist < FEAR.panicDistance && now >= state.calmUntil) {
      g.setPanic(true)
      state.panicUntil = now + FEAR.panicTime
      event = 'panic'
    }
  }

  if (Math.abs(stress - g.stress) > 0.002) g.setStress(stress)
  const afraid = stress > FEAR.heartbeatAt || g.panic
  if (afraid !== g.fear) g.setFear(afraid)
  setHeartbeatRate(0.9 + 0.6 * stress)
  const muffle = Math.round(stress * FEAR.muffle * 50) / 50
  if (muffle !== state.lastMuffle) {
    state.lastMuffle = muffle
    setMuffle(muffle)
  }
  return event
}

/** The last strike: stay frozen until he reaches you. */
export function freezeForGood() {
  state.panicUntil = Infinity
}

/** Bump fear up (e.g. he steps toward you). */
export function addFear(amount: number) {
  const g = useGame.getState()
  if (!g.panic) g.setStress(Math.min(1, g.stress + amount))
}

/** Back to calm (leaving a scene, trying again). */
export function resetFear() {
  const g = useGame.getState()
  g.setStress(0)
  g.setPanic(false)
  g.setFear(false)
  state.panicUntil = 0
  state.calmUntil = 0
  fearFocus.active = false
  state.lastMuffle = -1
  setMuffle(0)
  setHeartbeatRate(1)
}
