import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Frustum, MathUtils, Matrix4, Vector3, type Group } from 'three'
import { useGame } from '../store'
import { BOARDING, FEAR_DISTANCE, FIGURE, PLATFORM_STORY as S, PLATFORM_TEXT as TEXT, TRAIN_ARRIVAL } from '../data/platform'
import { PLATFORM_TUBES, tubeLevel, tubeZ } from './PlatformLights'
import { trainDoorCenters } from './Train'
import { CCTV_FORWARD, CCTV_POSITION, cctvState } from './CCTV'
import { playPresence, playTrainArrive, playTrainChime, TRAIN_ARRIVE_STOPS_AT } from '../audio/sounds'
import { Figure } from './Figure'

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
/** Seconds between his moves at the least, so he creeps rather than teleports. */
const MOVE_EVERY = 5
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
    vanished: false, // he's vanished on you at least once
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
      g.setFear(false)
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
    if (!s.started && fig) {
      s.started = true
      s.since = now
      // he's already here, waiting in the dark with his eyes shut
      fig.position.set(S.lurkAt.x, FLOOR_Y, S.lurkAt.z)
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
      // he always faces you
      fig.rotation.y = Math.atan2(me.x - fig.position.x, me.z - fig.position.z)
    }

    const reveal = () => {
      s.revealed = true
      if (fig) fig.userData.eyesOpen = true
    }

    // The bright light is yours: while it works, he never stands in it
    const brightAlive = !['dying', 'dark', 'waitTrain', 'train', 'board', 'boarding'].includes(s.beat)
    const brightZ = tubeZ(S.brightTube)
    const outOfLight = (z: number, side: number) =>
      brightAlive && Math.abs(z - brightZ) < FIGURE.brightKeepOut ? brightZ + (Math.sign(z - brightZ) || side) * FIGURE.brightKeepOut : z

    /** Puts him `fromMe` metres from you along the platform, on his side. */
    const placeAt = (fromMe: number) => {
      if (!fig) return
      const side = Math.sign(fig.position.z - me.z) || 1
      const z = outOfLight(me.z + side * fromMe, side)
      fig.position.z = MathUtils.clamp(z, PLATFORM_Z[0], PLATFORM_Z[1])
      fig.position.x = FIGURE.lane
    }

    // Walk at him and he's gone before you get there: he reappears out of sight
    if (fig?.visible && Math.hypot(me.x - fig.position.x, me.z - fig.position.z) < FIGURE.vanishDistance) {
      camera.getWorldDirection(tmp.look)
      const behind = tmp.look.z > 0 ? -1 : 1 // prefer the end of the platform behind you
      let best: number | null = null
      search: for (const d of FIGURE.reappearAt)
        for (const side of [behind, -behind]) {
          const z = me.z + side * d
          if (z < PLATFORM_Z[0] || z > PLATFORM_Z[1]) continue
          if (brightAlive && Math.abs(z - brightZ) < FIGURE.brightKeepOut) continue
          tmp.chest.set(FIGURE.lane, FLOOR_Y + 1.3, z)
          if (tmp.frustum.containsPoint(tmp.chest)) continue
          best = z
          break search
        }
      // nowhere out of sight: the far end from you
      if (best === null) best = me.z - PLATFORM_Z[0] > PLATFORM_Z[1] - me.z ? PLATFORM_Z[0] : PLATFORM_Z[1]
      fig.position.set(FIGURE.lane, FLOOR_Y, best)
      s.unseenFor = 0
      s.lastMove = now
      inView = false
      dist = Infinity
      if (s.revealed && !s.vanished) {
        s.vanished = true
        game.setThought(TEXT.vanished)
      }
    }

    /** He creeps closer, but only while you can't see him. */
    const creep = () => {
      if (!fig?.visible) return
      s.unseenFor = inView ? 0 : s.unseenFor + dt
      if (s.unseenFor < FIGURE.unseenTime || now - s.lastMove < MOVE_EVERY) return
      const gap = Math.abs(fig.position.z - me.z)
      if (gap <= FIGURE.minDistance + 0.5) return
      const before = fig.position.clone()
      placeAt(Math.max(FIGURE.minDistance, gap - FIGURE.step))
      // never pop into view: if the new spot is on screen, stay put
      tmp.chest.set(fig.position.x, fig.position.y + 1.3, fig.position.z)
      if (tmp.frustum.containsPoint(tmp.chest)) {
        fig.position.copy(before)
        return
      }
      s.lastMove = now
      s.unseenFor = 0
      if (s.moves++ % 2 === 0) playPresence('steps') // sometimes you hear him move
    }

    // Heartbeat when he's close and awake, except while you're calm in the light
    const afraid = s.revealed && fig?.visible === true && dist < FEAR_DISTANCE && s.beat !== 'calm'
    if (afraid !== game.fear) game.setFear(afraid)

    switch (s.beat) {
      case 'lurk': {
        // You found him: close enough, looking his way. His eyes open.
        if (inView && dist < S.revealDistance) {
          reveal()
          s.seenAt = now
          s.appearedAt = now
          game.setThought(TEXT.firstSeen)
          go('presence', now)
          break
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
          game.setCaption(TEXT.ritual)
          go('light', now)
        }
        creep()
        break

      case 'light': {
        const under = Math.hypot(me.x - PLATFORM_TUBES.x, me.z - tubeZ(S.brightTube)) < S.brightRadius
        s.hold = under ? s.hold + dt : Math.max(0, s.hold - dt * 2)
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
        if (game.trainDoorsOpen) {
          game.setCaption(TEXT.board)
          go('board', now)
        }
        break

      case 'board': {
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
  })

  return <Figure ref={figure} />
}
