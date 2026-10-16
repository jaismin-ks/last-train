import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Frustum, MathUtils, Matrix4, MeshBasicMaterial, MeshStandardMaterial, Vector3, type Group, type PointLight } from 'three'
import { DRACO, SCENE_FADE } from '../data/street'
import { RIDE as R, RIDE_TEXT as TEXT, SIREN, TUNNEL } from '../data/ride'
import { useGame } from '../store'
import { playPresence, playTrainBrake, playTrainChime, playTrainDoors, setTrainRun, stopAllAudio } from '../audio/sounds'
import { Train, TRAIN_MODEL, trainLights } from './Train'
import { FreeRoam, cameraShake } from './FreeRoam'
import { Figure } from './Figure'

type Beat = 'depart' | 'cruise' | 'brake' | 'held' | 'resume' | 'arrive' | 'doors' | 'cut'

/** Middle of the carriage you're in (z), for the passing tunnel lights. */
const CAR_Z = 57

/**
 * Emergency beacon on the carriage ceiling: a red light spinning like a siren,
 * sweeping round the walls. `level` (0–1) is read every frame.
 */
function Siren({ level }: { level: { current: number } }) {
  const beam = useRef<PointLight>(null)
  const glow = useRef<PointLight>(null)
  const lens = useMemo(() => new MeshBasicMaterial({ color: SIREN.color, toneMapped: false }), [])
  const base = useMemo(() => new MeshStandardMaterial({ color: '#222', roughness: 0.6 }), [])
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * Math.PI * 2 * SIREN.turnsPerSecond
    const on = level.current
    if (beam.current) {
      beam.current.position.set(Math.cos(a) * SIREN.sweep, -0.15, Math.sin(a) * SIREN.sweep)
      beam.current.intensity = SIREN.intensity * on
    }
    // the lens brightens each time the beam swings toward you
    const flash = 0.35 + 0.65 * Math.max(0, Math.sin(a))
    if (glow.current) glow.current.intensity = SIREN.glow * on * flash
    lens.color.set(SIREN.color).multiplyScalar(on > 0 ? 0.3 + 0.7 * flash : 0.15)
  })
  return (
    <group position={SIREN.position}>
      <mesh material={base} position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
      </mesh>
      <mesh material={lens} position={[0, -0.04, 0]}>
        <sphereGeometry args={[0.075, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>
      <pointLight ref={beam} color={SIREN.color} intensity={0} distance={SIREN.distance} decay={2} />
      <pointLight ref={glow} position={[0, -0.12, 0]} color={SIREN.color} intensity={0} distance={2.5} decay={2} />
    </group>
  )
}

/** Tunnel walls and lamps streaming past the windows. `speed` is read every frame. */
function Tunnel({ speed }: { speed: { current: number } }) {
  const lamps = useRef<Group>(null)
  const sweep = useRef<(PointLight | null)[]>([])
  const offset = useRef(0)
  const mats = useMemo(
    () => ({
      wall: new MeshStandardMaterial({ color: TUNNEL.wallColor, roughness: 1 }),
      lamp: new MeshBasicMaterial({ color: TUNNEL.lampColor, toneMapped: false }),
    }),
    [],
  )
  const count = Math.ceil(TUNNEL.lampLength / TUNNEL.lampSpacing)
  const start = CAR_Z - TUNNEL.lampLength / 2

  useFrame((_, dt) => {
    // the train goes toward -z, so the tunnel slides past toward +z
    offset.current = (offset.current + speed.current * TUNNEL.topSpeed * Math.min(dt, 0.1)) % TUNNEL.lampSpacing
    lamps.current?.children.forEach((c, i) => {
      c.position.z = start + ((i % count) * TUNNEL.lampSpacing + offset.current)
    })
    // one light per side rides along with whichever lamp is passing the carriage
    const z = CAR_Z - TUNNEL.lampSpacing / 2 + offset.current
    for (const l of sweep.current) {
      if (!l) continue
      l.position.z = z
      l.intensity = speed.current > 0.02 ? 9 : 0 // lamps between stations don't light a stopped train much
    }
  })

  return (
    <group>
      {TUNNEL.sides.map((x, s) => (
        <mesh key={s} material={mats.wall} position={[x + (s === 0 ? -0.3 : 0.3), -8, CAR_Z]} rotation={[0, s === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <planeGeometry args={[TUNNEL.lampLength + 40, 7]} />
        </mesh>
      ))}
      <group ref={lamps}>
        {TUNNEL.sides.flatMap((x, s) =>
          Array.from({ length: count }, (_, i) => (
            <mesh key={`${s}-${i}`} material={mats.lamp} position={[x, TUNNEL.lampY, 0]}>
              <boxGeometry args={[0.12, 0.12, 0.7]} />
            </mesh>
          )),
        )}
      </group>
      {TUNNEL.sides.map((x, s) => (
        <pointLight key={s} ref={(el) => (sweep.current[s] = el)} position={[x + (s === 0 ? 0.6 : -0.6), TUNNEL.lampY, CAR_Z]} color={TUNNEL.lampColor} intensity={0} distance={6} decay={2} />
      ))}
    </group>
  )
}

/**
 * The ride (see data/ride.ts): you're inside the middle carriage. The train
 * pulls away, he's in the next carriage, it stops dead in the tunnel, he's in
 * yours and moves only when the lights flicker. Then your stop.
 */
export function Ride() {
  const { scene: train } = useGLTF(TRAIN_MODEL, DRACO)
  const camera = useThree((s) => s.camera)
  const figure = useRef<Group>(null)
  const speed = useRef(0) // 0 stopped → 1 full speed
  const siren = useRef(0) // emergency beacon, 0 off → 1 spinning
  const st = useRef({
    beat: 'depart' as Beat,
    since: -1,
    started: -1,
    seenAt: -1,
    nextFlicker: 0,
    flickerUntil: 0,
    said: new Set<string>(),
  })
  const tmp = useMemo(() => ({ frustum: new Frustum(), m: new Matrix4(), p: new Vector3() }), [])
  const start = useMemo(() => new Vector3(R.start.x, R.area.floorY, R.start.z), [])

  // Dev only: N skips ahead (speeds through the current beat)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __ride: unknown }).__ride = { st, figure } // dev: inspect the story
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyN') return
      const s = st.current
      s.since -= 1000
      s.started -= 1000
      if (s.beat === 'cruise' && s.seenAt < 0 && figure.current?.visible) s.seenAt = 0.001
      if (s.beat === 'held') s.nextFlicker = 0
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Set up the carriage: doors shut, lights on, fog black
  useEffect(() => {
    const g = useGame.getState()
    g.setTrainState('riding')
    g.setTrainDoorsOpen(false)
    g.setPlatformLightsOn(true)
    g.setBlackout(1)
    trainLights.level = 1
    trainLights.emergency = 0
    camera.near = 0.05
    camera.updateProjectionMatrix()
    return () => {
      setTrainRun(0)
      cameraShake.amount = 0
      trainLights.level = 1
      trainLights.emergency = 0
      const s = useGame.getState()
      s.setFear(false)
      s.setCaption(null)
      s.setInputLocked(false)
      s.setTrainState('hidden')
    }
  }, [camera])

  useFrame(({ clock }) => {
    const now = clock.elapsedTime
    const s = st.current
    if (s.started < 0) {
      s.started = s.since = now
      s.nextFlicker = now + 999
    }
    const t = now - s.since
    const game = useGame.getState()
    const fig = figure.current
    const me = camera.position
    const once = (key: string, fn: () => void) => {
      if (s.said.has(key)) return
      s.said.add(key)
      fn()
    }
    const go = (beat: Beat) => {
      s.beat = beat
      s.since = now
    }

    // Fade in from black once the doors have shut behind you
    const sinceStart = now - s.started
    if (s.beat !== 'cut') {
      const k = MathUtils.clamp((sinceStart - 0.8) / SCENE_FADE.in, 0, 1)
      if (k < 1 || game.blackout > 0) game.setBlackout(1 - k * k * (3 - 2 * k))
    }

    // Is he on screen?
    tmp.m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    tmp.frustum.setFromProjectionMatrix(tmp.m)
    let inView = false
    let dist = Infinity
    if (fig?.visible) {
      tmp.p.set(fig.position.x, fig.position.y + 1.4, fig.position.z)
      dist = tmp.p.distanceTo(me)
      inView = tmp.frustum.containsPoint(tmp.p)
      fig.rotation.y = Math.atan2(me.x - fig.position.x, me.z - fig.position.z)
    }

    // Walk right up to him and he's gone — at the far end of the carriage instead
    if (fig?.visible && s.beat === 'held' && Math.hypot(me.x - fig.position.x, me.z - fig.position.z) < R.vanishDistance) {
      const toMax = R.area.maxZ - me.z
      const toMin = me.z - R.area.minZ
      fig.position.set(-73.25, R.area.floorY, toMax > toMin ? R.area.maxZ : R.area.minZ)
    }

    /** The carriage lights stutter; during the dark moment, `onDark` runs once. */
    const flicker = (onDark: () => void) => {
      if (now > s.nextFlicker) {
        s.flickerUntil = now + R.flickerDark
        const [lo, hi] = R.flickerEvery
        s.nextFlicker = now + lo + Math.random() * (hi - lo)
        onDark()
      }
      const dark = now < s.flickerUntil
      trainLights.level = dark ? (Math.random() < 0.3 ? 0.4 : 0.02) : s.beat === 'held' ? SIREN.carriageLight : 1
    }

    switch (s.beat) {
      case 'depart': {
        if (sinceStart > 0.3) once('doors', () => playTrainDoors())
        if (sinceStart > 2.5) once('boarded', () => game.setThought(TEXT.boarded))
        speed.current = MathUtils.clamp((sinceStart - 1.5) / R.accelerate, 0, 1)
        speed.current *= speed.current // gentle start
        if (speed.current >= 1) go('cruise')
        break
      }

      case 'cruise': {
        speed.current = 1
        // he's standing in the next carriage, looking at you through the end door
        if (t > R.cruiseBeforeFigure && fig && !fig.visible) {
          fig.position.set(R.nextCarAt.x, R.area.floorY, R.nextCarAt.z)
          fig.userData.eyesOpen = true
          fig.visible = true
        }
        if (fig?.visible) {
          if (inView && s.seenAt < 0) {
            s.seenAt = now
            game.setThought(TEXT.seenHim)
          }
          if (s.seenAt < 0 && t > R.cruiseBeforeFigure + R.figureLookTimeout) {
            s.seenAt = now
            playPresence('cough') // you never looked: you hear him
          }
          if (s.seenAt > 0 && now - s.seenAt > R.brakeAfterSeen) {
            playTrainBrake()
            go('brake')
          }
        }
        break
      }

      case 'brake': {
        const k = Math.min(1, t / R.brakeTime)
        speed.current = 1 - k * (2 - k) // hard at first
        cameraShake.amount = 0.05 * (1 - k)
        // lights stutter and drop to dim emergency lighting; the red siren starts
        trainLights.level = Math.random() < 0.4 ? 0.05 : 1 - (1 - SIREN.carriageLight) * k
        trainLights.emergency = SIREN.warmth * k
        siren.current = k
        if (k >= 1) {
          speed.current = 0
          trainLights.level = SIREN.carriageLight
          go('held')
        }
        break
      }

      case 'held': {
        if (t > R.paDelay) once('pa', () => game.setCaption(TEXT.pa))
        if (t > R.paDelay + R.paShowFor) once('paOff', () => game.setCaption(null))
        if (t > R.paDelay + 1.5) {
          if (s.nextFlicker > now + 100) s.nextFlicker = now + 1.5
          flicker(() => {
            if (!fig) return
            // each time the lights go out, he's closer
            if (!s.said.has('inCar')) {
              s.said.add('inCar')
              const side = me.z < CAR_Z ? 1 : -1 // the far end from you
              fig.position.set(-73.25, R.area.floorY, MathUtils.clamp(me.z + side * R.heldStartGap, R.area.minZ, R.area.maxZ))
              return
            }
            const gap = fig.position.z - me.z
            const next = Math.max(R.heldClosest, Math.abs(gap) - R.heldStep)
            fig.position.z = me.z + Math.sign(gap || 1) * next
            fig.position.x = MathUtils.clamp(me.x, R.area.minX + 0.3, R.area.maxX - 0.3)
            if (next <= R.heldClosest + 0.01) once('closest', () => (s.since = now)) // start the resume countdown
            else if (next < 8) once('dontLook', () => game.setThought(TEXT.dontLook))
          })
        }
        if (s.said.has('closest') && t > R.resumeAfter) {
          game.setThought(TEXT.moving)
          trainLights.level = 1
          trainLights.emergency = 0
          siren.current = 0
          go('resume')
        }
        break
      }

      case 'resume':
        speed.current = Math.min(1, t / R.accelerate)
        if (t > R.resumeRide) {
          game.setCaption(TEXT.yourStop)
          go('arrive')
        }
        break

      case 'arrive': {
        const k = Math.min(1, t / R.arriveTime)
        speed.current = 1 - k
        if (k >= 1) {
          game.setCaption(null)
          playTrainChime()
          go('doors')
        }
        break
      }

      case 'doors':
        if (t > 1.2) once('open', () => {
          game.setTrainDoorsOpen(true)
          playTrainDoors()
        })
        // the doors open — and it cuts to black, the chime ringing over silence
        if (t > 2.4) {
          game.setBlackout(1)
          stopAllAudio(50)
          setTimeout(playTrainChime, 150) // after everything else has stopped
          go('cut')
        }
        break

      case 'cut':
        if (t > 3.5) game.setPhase('endCard')
        break
    }

    if (s.beat !== 'brake') cameraShake.amount = TUNNEL.shake * speed.current
    setTrainRun(s.beat === 'cut' ? 0 : speed.current)
    const afraid = fig?.visible === true && dist < 9
    if (afraid !== game.fear) game.setFear(afraid)
  })

  return (
    <>
      <color attach="background" args={['#000']} />
      <fog attach="fog" args={['#000000', 4, 40]} />
      <hemisphereLight args={['#1b2420', '#050505', 0.35]} />
      <Train />
      <Tunnel speed={speed} />
      <Siren level={siren} />
      <Figure ref={figure} />
      <FreeRoam area={R.area} collide={train} start={start} startHeading={MathUtils.degToRad(R.start.headingDeg)} />
    </>
  )
}
