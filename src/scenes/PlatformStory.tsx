import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Frustum, MathUtils, Matrix4, Vector3, type Group } from 'three'
import { useGame } from '../store'
import { BOARDING, FIGURE, PLATFORM_STORY as S, PLATFORM_TEXT as TEXT, TRAIN_ARRIVAL } from '../data/platform'
import { PLATFORM_TUBES, tubeLevel, tubeZ } from './PlatformLights'
import { trainDoorCenters } from './Train'
import { CCTV_FORWARD, CCTV_POSITION, cctvState } from './CCTV'
import { playPresence, playTrainArrive, playTrainChime, setFootsteps, TRAIN_ARRIVE_STOPS_AT } from '../audio/sounds'
import { Figure, isWalking, stopWalking, walkTo } from './Figure'
import { addFear, fearFocus, freezeForGood, resetFear, stepFear } from '../systems/fear'
import { APPROACH, CAUGHT, FEAR, FIGURE_WALK } from '../data/fear'

type Beat =
  | 'lurk'
  | 'appear'
  | 'presence'
  | 'camera'
  | 'cameraAfter'
  | 'light'
  | 'calm'
  | 'dying'
  | 'dark'
  | 'waitTrain'
  | 'train'
  | 'board'
  | 'boarding'

/** Platform floor height; the figure stands on it. */
const FLOOR_Y = -10.02
/** Ends of the platform he can stand on (z); the far end wall is at ~85.8. */
const PLATFORM_Z = [24.5, 85.2]
/** Number of tubes along the platform. */
const TUBES = 7

/**
 * Runs the platform story once you're on the platform (see data/platform.ts):
 * he waits unseen in the dark until you find him (or he finds you), then moves
 * only when you're not looking. The camera and the bright light are your two
 * comforts, and both fail. Then the train arrives.
 */
export function PlatformStory() {
  const camera = useThree((s) => s.camera)
  const figure = useRef<Group>(null)
  const st = useRef({
    beat: 'lurk' as Beat,
    since: 0, // time the current beat started
    started: false,
    revealed: false, // eyes open, he's "on"
    seenAt: -1, // first time you saw him (revealed)
    unseenFor: 0,
    lastMove: -Infinity,
    appearTube: -1,
    appearedAt: -1,
    keysHeard: false, // his keys, heard before you find him
    lurkPicked: 0, // when he last chose a hiding spot
    lurkLastZ: 0, // where you were then (which way you're heading)
    lastMe: null as Vector3 | null, // where you were last frame
    approachedAt: -99, // last time you walked toward him
    finalStrike: false, // the third freeze: he walks all the way to you
    restUntil: 0, // pausing between walks
    clearing: false, // walking out of your way
    strikes: 0, // times you've frozen up close (third time, he reaches you)
    closed: 0, // metres YOU have walked toward him (he answers every APPROACH.approachStep)
    moves: 0,
    hold: 0, // seconds doing the current ritual
    skip: false, // dev: N pressed
  })
  const tmp = useMemo(
    () => ({ frustum: new Frustum(), m: new Matrix4(), chest: new Vector3(), look: new Vector3(), to: new Vector3() }),
    [],
  )

  const go = (beat: Beat, now: number) => {
    st.current.beat = beat
    st.current.since = now
    st.current.skip = false
    st.current.hold = 0
  }

  // Dev only: N skips ahead to the next beat while testing
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyN') return
      st.current.since -= 1000
      st.current.skip = true
      if (st.current.seenAt < 0 && st.current.revealed) st.current.seenAt = 0.001 // counts as seen long ago
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Leave everything as it was if the platform goes away
  useEffect(
    () => () => {
      tubeLevel.length = 0
      cctvState.diesAt = -1
      const g = useGame.getState()
      resetFear()
      g.setInputLocked(false)
      g.setCaption(null)
      g.setTrainState('hidden')
      g.setTrainDoorsOpen(false)
    },
    [],
  )

  useFrame(({ clock }, dt) => {
    const now = clock.elapsedTime
    const s = st.current
    const fig = figure.current
    const game0 = useGame.getState()
    if (!s.started && fig) {
      game0.setCheckpoint('platform') // Try again from here starts on the platform
      s.started = true
      s.since = now
      // he's already here, waiting in the dark with his eyes shut (the far dark stretch to begin with)
      const first = S.lurkSpots[3]
      fig.position.set(first.x, FLOOR_Y, first.z)
      fig.userData.eyesOpen = false
      fig.visible = true
    }
    if (!s.started) return
    const t = now - s.since
    const game = useGame.getState()
    const me = camera.position

    // Is he on screen (and close enough to make out)?
    tmp.m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    tmp.frustum.setFromProjectionMatrix(tmp.m)
    let inView = false
    let dist = Infinity
    if (fig?.visible) {
      tmp.chest.set(fig.position.x, fig.position.y + 1.3, fig.position.z)
      dist = tmp.chest.distanceTo(me)
      inView = tmp.frustum.containsPoint(tmp.chest) && dist < FIGURE.maxSeenDistance
      // standing, he always faces you (walking, he faces where he's going)
      if (!isWalking(fig)) {
        const want = Math.atan2(me.x - fig.position.x, me.z - fig.position.z)
        fig.rotation.y += Math.atan2(Math.sin(want - fig.rotation.y), Math.cos(want - fig.rotation.y)) * Math.min(1, dt * 5)
      }
    }

    const reveal = () => {
      s.revealed = true
      if (fig) fig.userData.eyesOpen = true
    }

    // The bright light (while it works) and the camera (while you need it) are yours: he keeps clear of them
    const brightAlive = !['dying', 'dark', 'waitTrain', 'train', 'board', 'boarding'].includes(s.beat)
    const brightZ = tubeZ(S.brightTube)
    const cameraNeeded = ['lurk', 'appear', 'presence', 'camera'].includes(s.beat)
    const zones: { z: number; r: number }[] = []
    if (brightAlive) zones.push({ z: brightZ, r: FIGURE.brightKeepOut })
    if (cameraNeeded) zones.push({ z: CCTV_POSITION.z, r: FIGURE.cameraKeepOut })
    const outOfLight = (z: number, side: number) => {
      for (const { z: c, r } of zones) if (Math.abs(z - c) < r) z = c + (Math.sign(z - c) || side) * r
      return z
    }
    // where you're meant to be heading right now (he never stands in the way)
    const goal = s.beat === 'camera' ? CCTV_POSITION.z : s.beat === 'light' || s.beat === 'cameraAfter' ? brightZ : null

    /** Where along the platform is `fromMe` metres from you, on his side (kept out of the light). */
    const spotFromMe = (fromMe: number) => {
      const side = Math.sign((fig?.position.z ?? me.z) - me.z) || 1
      return MathUtils.clamp(outOfLight(me.z + side * fromMe, side), PLATFORM_Z[0], PLATFORM_Z[1])
    }
    /** Puts him there at once (only in the dark, when you can't see it happen). */
    const placeAt = (fromMe: number) => {
      if (!fig) return
      stopWalking(fig)
      fig.position.set(FIGURE.lane, FLOOR_Y, spotFromMe(fromMe))
    }

    // Horizontal distance to him: for walking at him and for him reaching you
    const near = fig?.visible ? Math.hypot(me.x - fig.position.x, me.z - fig.position.z) : Infinity
    if (fig) fig.userData.seen = inView
    Object.assign(fearFocus, fig?.visible && s.revealed ? { active: true, x: fig.position.x, y: fig.position.y + 1.68, z: fig.position.z } : { active: false })

    // How far YOU just moved toward him (him walking toward you doesn't count)
    let towardHim = 0
    if (fig && s.lastMe && s.revealed) {
      tmp.to.set(fig.position.x - me.x, 0, fig.position.z - me.z).normalize()
      towardHim = Math.max(0, (me.x - s.lastMe.x) * tmp.to.x + (me.z - s.lastMe.z) * tmp.to.z)
    }
    if (towardHim > 0.001) s.approachedAt = now

    // He reaches you: only if you walk into him, or on the last strike. He never says a word.
    if (s.revealed && near < APPROACH.contact && (towardHim > 0.001 || s.finalStrike) && !game.missed) {
      game.fail(CAUGHT.heading, CAUGHT.line)
      setFootsteps(0)
      return
    }

    // Walk at him and he doesn't back off: he comes to you
    if (s.revealed && fig && near < APPROACH.range && !game.panic) {
      s.closed += towardHim
      if (s.closed >= APPROACH.approachStep) {
        s.closed = 0
        // he answers with a step of his own, but never closes the last stretch himself
        const toward = Math.max(APPROACH.holdOff, near - APPROACH.stepToward)
        // straight at you (but never into the bright light while it works)
        const k = toward / Math.max(near, 0.001)
        const z = outOfLight(me.z + (fig.position.z - me.z) * k, Math.sign(fig.position.z - me.z) || 1)
        walkTo(fig, me.x + (fig.position.x - me.x) * k, z, FIGURE_WALK.toward)
        addFear(APPROACH.fearJump)
        s.lastMove = now
      }
    } else s.closed = 0
    s.lastMe = (s.lastMe ?? new Vector3()).copy(me)

    /**
     * He walks the platform: slowly, to a spot a set distance from you (closer
     * as the night goes on), pauses, then on to another. He keeps clear of the
     * camera and the light, and if he's between you and where you're going he
     * walks on past it, out of your way.
     */
    const creep = () => {
      if (!fig?.visible || game.panic || s.finalStrike) return
      const band = FIGURE.patrol[s.beat as keyof typeof FIGURE.patrol]
      if (!band) return
      // in your way? (between you and where you're heading) — move on past it
      if (goal !== null && !s.clearing) {
        const lo = Math.min(me.z, goal) - 1
        const hi = Math.max(me.z, goal) + 1
        if (fig.position.z > lo && fig.position.z < hi) {
          const beyond = goal + Math.sign(goal - me.z || 1) * (FIGURE.cameraKeepOut + 3)
          walkTo(fig, FIGURE.lane, MathUtils.clamp(beyond, PLATFORM_Z[0], PLATFORM_Z[1]), FIGURE_WALK.creep)
          s.clearing = true
          return
        }
      }
      if (isWalking(fig)) return
      s.clearing = false
      if (s.restUntil === 0) s.restUntil = now + FIGURE.patrolRest[0] + Math.random() * (FIGURE.patrolRest[1] - FIGURE.patrolRest[0])
      if (now < s.restUntil) return
      s.restUntil = 0
      // a new spot: same side of you as now (mostly), the right distance away, clear of the camera / light / your path
      const mySide = Math.sign(fig.position.z - me.z) || 1
      for (let tries = 0; tries < 8; tries++) {
        const side = tries < 5 ? mySide : -mySide
        const d = band[0] + Math.random() * (band[1] - band[0])
        let z = outOfLight(me.z + side * d, side)
        z = MathUtils.clamp(z, PLATFORM_Z[0], PLATFORM_Z[1])
        if (goal !== null && z > Math.min(me.z, goal) - 1 && z < Math.max(me.z, goal) + 1) continue
        if (Math.abs(z - me.z) < band[0] * 0.8) continue
        walkTo(fig, FIGURE.lane + (Math.random() - 0.5) * 0.8, z, FIGURE_WALK.creep)
        s.lastMove = now
        if (!inView && s.moves++ % 3 === 0) playPresence('steps') // sometimes you hear him moving
        break
      }
    }

    let calm = s.beat === 'calm' // somewhere safe: fear drains (set below for the rituals)

    switch (s.beat) {
      case 'lurk': {
        // You found him: close enough, looking his way. His eyes open.
        // (or you've backed right into him without looking)
        // Before you find him: the keys from the street, somewhere close
        if (!s.keysHeard && !inView && near < S.keysDistance) {
          s.keysHeard = true
          playPresence('keys')
        }
        if ((inView && dist < S.revealDistance) || near < 4) {
          reveal()
          s.seenAt = now
          s.appearedAt = now
          game.setThought(s.keysHeard ? TEXT.firstSeenKeys : TEXT.firstSeen)
          go('presence', now)
          break
        }
        // While you explore, he slips (unseen) into a dark spot ahead of where you're heading
        if (fig && now - s.lurkPicked > S.lurkRepick) {
          s.lurkPicked = now
          const moved = me.z - s.lurkLastZ
          s.lurkLastZ = me.z
          camera.getWorldDirection(tmp.look)
          const heading = Math.abs(moved) > 0.3 ? Math.sign(moved) : Math.sign(tmp.look.z) || 1
          tmp.chest.set(fig.position.x, FLOOR_Y + 1.3, fig.position.z)
          const hiddenNow = !tmp.frustum.containsPoint(tmp.chest)
          if (hiddenNow) {
            let best: { x: number; z: number } | null = null
            let bestScore = Infinity
            for (const spot of S.lurkSpots) {
              const d = Math.hypot(spot.x - me.x, spot.z - me.z)
              if (d < S.lurkRange.min || d > S.lurkRange.max) continue
              if ((spot.z - me.z) * heading < 0) continue // only ahead of you
              tmp.chest.set(spot.x, FLOOR_Y + 1.3, spot.z)
              if (tmp.frustum.containsPoint(tmp.chest)) continue // never pop into view
              const score = Math.abs(d - S.lurkRange.ideal)
              if (score < bestScore) {
                bestScore = score
                best = spot
              }
            }
            if (best) fig.position.set(best.x, FLOOR_Y, best.z)
          }
        }
        // Never found him: he comes to you, under a light you're looking at
        if (t > S.lurkTime || s.skip) {
          const { min, max, ideal } = S.appearDistance
          let best = -1
          let bestScore = Infinity
          for (let i = 0; i < TUBES; i++) {
            if (PLATFORM_TUBES.dead.includes(i) || i === S.brightTube) continue
            tmp.chest.set(PLATFORM_TUBES.x, FLOOR_Y + 1.3, tubeZ(i))
            const d = Math.abs(tubeZ(i) - me.z)
            const visible = tmp.frustum.containsPoint(tmp.chest) && d >= min && d <= max
            const score = Math.abs(d - ideal) + (visible ? 0 : 1000)
            if (score < bestScore) {
              bestScore = score
              best = i
            }
          }
          s.appearTube = best
          go('appear', now)
        }
        break
      }

      case 'appear': {
        // the light stutters, goes out, and he's there when it comes back
        const stutter = 0.5
        const i = s.appearTube
        tubeLevel[i] = t < stutter ? (Math.sin(t * 60) > 0 ? 1 : 0.1) : t < stutter + S.appearDarkTime ? 0 : 1
        if (t > stutter && fig && !s.revealed) {
          const away = Math.sign(tubeZ(i) - me.z) || 1
          fig.position.set(FIGURE.lane, FLOOR_Y, MathUtils.clamp(tubeZ(i) + away * S.appearBehindLight, PLATFORM_Z[0], PLATFORM_Z[1]))
          reveal()
        }
        if (t > stutter + S.appearDarkTime) {
          s.appearedAt = now
          if (!inView) playPresence('cough') // facing away: you hear him instead
          go('presence', now)
        }
        break
      }

      case 'presence':
        if (inView && s.seenAt < 0) {
          s.seenAt = now
          game.setThought(TEXT.firstSeen)
        }
        if ((s.seenAt >= 0 && now - s.seenAt > S.ritualDelay) || now - s.appearedAt > S.ritualLatest || s.skip) {
          game.setThought(TEXT.cameraNudge)
          game.setCaption(TEXT.camera)
          go('camera', now)
        }
        creep()
        break

      case 'camera': {
        // stand where it can see you, facing it (flat angles: up/down doesn't matter)
        tmp.to.set(me.x - CCTV_POSITION.x, 0, me.z - CCTV_POSITION.z) // camera → you
        const seen = tmp.to.length() < S.cameraRadius && CCTV_FORWARD.angleTo(tmp.to) < MathUtils.degToRad(S.cameraViewDeg)
        camera.getWorldDirection(tmp.look)
        tmp.look.y = 0
        tmp.to.negate() // you → camera
        const facing = tmp.look.angleTo(tmp.to) < MathUtils.degToRad(S.cameraLookDeg)
        s.hold = seen && facing ? s.hold + dt : Math.max(0, s.hold - dt)
        if (seen) calm = true // the camera's watching: it helps, for now
        if (s.hold >= S.cameraHold || s.skip) {
          cctvState.diesAt = now // its light stutters and dies
          game.setCaption(null)
          go('cameraAfter', now)
        }
        creep()
        break
      }

      case 'cameraAfter':
        if (t > 1.2 && t - dt <= 1.2) game.setThought(TEXT.cameraDead)
        if (t > S.cameraAfter) {
          game.setThought(TEXT.lightNudge)
          game.setCaption(TEXT.ritual)
          go('light', now)
        }
        creep()
        break

      case 'light': {
        const under = Math.hypot(me.x - PLATFORM_TUBES.x, me.z - tubeZ(S.brightTube)) < S.brightRadius
        s.hold = under ? s.hold + dt : Math.max(0, s.hold - dt * 2)
        if (under) calm = true
        if (s.hold >= S.brightHold || s.skip) {
          game.setCaption(null)
          game.setThought(TEXT.calm)
          go('calm', now)
        }
        creep()
        break
      }

      case 'calm':
        // he waits while you're in the light
        if (t > S.calmTime) go('dying', now)
        break

      case 'dying':
        // the bright tube buzzes and stutters out
        tubeLevel[S.brightTube] = Math.random() < 0.35 + (t / S.dyingTime) * 0.5 ? 0.05 : 1
        if (t > S.dyingTime) {
          tubeLevel[S.brightTube] = 0
          placeAt(S.darkApproach) // in the dark, he's closer
          game.setThought(TEXT.dark)
          go('dark', now)
        }
        break

      case 'dark': {
        // every light cuts out for a moment (that's when he moved), then the rest come back
        const blackout = t < S.allDarkTime
        for (let i = 0; i < TUBES; i++) if (i !== S.brightTube) tubeLevel[i] = blackout ? 0 : 1
        if (t > S.darkTime) {
          playTrainArrive() // faint rumble far down the tunnel, building
          go('waitTrain', now)
        }
        break
      }

      case 'waitTrain':
        creep()
        if (t > TRAIN_ARRIVE_STOPS_AT - TRAIN_ARRIVAL.time) {
          game.setTrainState('arriving')
          game.setThought(TEXT.trainHeard)
          go('train', now)
        }
        break

      case 'train':
        creep()
        if (game.trainDoorsOpen) {
          game.setCaption(TEXT.board)
          go('board', now)
        }
        break

      case 'board': {
        creep()
        const atDoor = me.x < BOARDING.edgeX && trainDoorCenters.some((d) => Math.abs(d.z - me.z) < BOARDING.doorHalfWidth)
        if (atDoor) {
          game.setCaption(null)
          game.setInputLocked(true)
          playTrainChime()
          go('boarding', now)
        }
        break
      }

      case 'boarding': {
        const k = Math.min(1, t / BOARDING.fade)
        game.setBlackout(k * k * (3 - 2 * k))
        if (k >= 1) {
          game.setTrainDoorsOpen(false)
          game.setPlatformLightsOn(false)
          game.setInputLocked(false)
          game.setPhase('ride')
        }
        break
      }
    }

    // Fear: rises with him near and in sight, drains when you're safe. At the top you freeze.
    const approaching = now - s.approachedAt < 0.8
    if (stepFear(now, dt, s.revealed ? near : Infinity, inView, calm, approaching) === 'panic' && fig && s.revealed) {
      s.strikes += 1
      if (s.strikes >= FEAR.strikes) {
        // third time: you can't move at all, and he walks all the way to you
        freezeForGood()
        s.finalStrike = true
        walkTo(fig, me.x, me.z, FIGURE_WALK.toward)
      } else {
        // he walks a little closer and stops; then you can move again
        const k = Math.max(APPROACH.holdOff, near - FEAR.panicStep) / Math.max(near, 0.001)
        walkTo(fig, me.x + (fig.position.x - me.x) * k, outOfLight(me.z + (fig.position.z - me.z) * k, 1), FIGURE_WALK.toward)
      }
      game.setThought(FEAR.lastLines[Math.min(s.strikes, FEAR.lastLines.length) - 1])
    }
  })

  return <Figure ref={figure} />
}
