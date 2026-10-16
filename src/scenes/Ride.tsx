import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  Frustum,
  MathUtils,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  DoubleSide,
  Object3D,
  Raycaster,
  Vector3,
  type Group,
  type Mesh,
  type HemisphereLight,
  type PointLight,
  type SpotLight,
} from 'three'
import { DRACO, SCENE_FADE } from '../data/street'
import { RIDE as R, RIDE_TEXT as TEXT, SEATS, SIREN, TUNNEL } from '../data/ride'
import { useGame } from '../store'
import { playPresence, playTrainBrake, playTrainChime, playTrainDoors, setTrainRun, stopAllAudio } from '../audio/sounds'
import { Train, TRAIN_MODEL, trainLights } from './Train'
import { FreeRoam, cameraShake, seat } from './FreeRoam'
import { Figure, isWalking, stopWalking, walkTo } from './Figure'
import { addFear, fearFocus, freezeForGood, resetFear, stepFear } from '../systems/fear'
import { APPROACH, CAUGHT, FEAR, FIGURE_WALK } from '../data/fear'

type Beat = 'depart' | 'cruise' | 'brake' | 'held' | 'resume' | 'arrive' | 'doors' | 'cut'

/** Middle of the carriage you're in (z), for the passing tunnel lights. */
const CAR_Z = 57
const CAR_X = -73.25
/** General fill light in the carriage (dims during the emergency). */
const FILL = 0.35

type SeatSpot = { x: number; z: number; y: number; side: number }

/**
 * Finds the seats in your carriage: samples down along both walls for the seat
 * cushions (material "side_chair") and puts a sitting spot every SEATS.spacing.
 */
function findSeats(train: Object3D): SeatSpot[] {
  const car = train.getObjectByName('LT_Car_1')
  if (!car) return []
  car.updateWorldMatrix(true, true)
  const meshes: Mesh[] = []
  car.traverse((o) => (o as Mesh).isMesh && meshes.push(o as Mesh))
  const ray = new Raycaster()
  const down = new Vector3(0, -1, 0)
  const spots: SeatSpot[] = []
  for (const side of [-1, 1]) {
    const x = CAR_X + side * SEATS.fromCentre
    let run: { z: number; y: number }[] = []
    const flush = () => {
      // a run of cushion: seat spots spread evenly along it
      if (run.length) {
        const from = run[0].z
        const to = run[run.length - 1].z
        const n = Math.max(1, Math.round((to - from) / SEATS.spacing))
        for (let k = 0; k < n; k++) {
          const z = from + ((k + 0.5) * (to - from)) / n
          spots.push({ x, z, y: run[0].y, side })
        }
      }
      run = []
    }
    for (let z = R.area.minZ - 0.3; z <= R.area.maxZ + 0.3; z += 0.1) {
      ray.set(new Vector3(x, R.area.floorY + 1.2, z), down)
      ray.far = 2
      const hit = ray.intersectObjects(meshes, false)[0]
      const isSeat = hit && ((hit.object as Mesh).material as { name?: string }).name === 'side_chair'
      if (isSeat) run.push({ z, y: hit.point.y })
      else flush()
    }
    flush()
  }
  return spots
}

/**
 * Emergency beacon on the carriage roof (beside the handrail): a red dome with
 * a bright lamp spinning inside, throwing two tight red beams that sweep round
 * the carriage like a siren. `level` (0–1) is read every frame.
 */
function Siren({ level }: { level: { current: number } }) {
  const spinner = useRef<Group>(null)
  const beams = useRef<(SpotLight | null)[]>([])
  const glow = useRef<PointLight>(null)
  const targets = useMemo(() => [new Object3D(), new Object3D()], [])
  const mats = useMemo(
    () => ({
      base: new MeshStandardMaterial({ color: '#141515', roughness: 0.55, metalness: 0.5 }),
      // ribbed red glass you can see the reflector turning through
      lens: new MeshStandardMaterial({
        color: '#7a0d08',
        emissive: SIREN.color,
        emissiveIntensity: 0.2,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        side: DoubleSide,
      }),
      reflector: new MeshStandardMaterial({ color: '#ffd9cf', emissive: '#ff6a50', emissiveIntensity: 0.3, roughness: 0.15, metalness: 0.9, side: DoubleSide }),
      bulb: new MeshBasicMaterial({ color: '#ffe2d8', toneMapped: false }),
    }),
    [],
  )
  const [x, y, z] = SIREN.position
  const lampY = y - 0.1 // middle of the dome
  useFrame(({ clock }) => {
    const on = level.current
    const a = clock.elapsedTime * Math.PI * 2 * SIREN.turnsPerSecond
    if (spinner.current) spinner.current.rotation.y = a
    // two beams back to back, aimed out and a little down, going round with the lamp
    targets.forEach((t, k) => {
      const b = a + k * Math.PI
      t.position.set(x + Math.cos(b) * 4, lampY - SIREN.beamDrop, z + Math.sin(b) * 4)
      t.updateMatrixWorld()
      const beam = beams.current[k]
      if (beam) beam.intensity = SIREN.intensity * on
    })
    // the dome flares each time a beam swings past you
    const flash = 0.3 + 0.7 * Math.abs(Math.sin(a))
    if (glow.current) glow.current.intensity = SIREN.glow * on * flash
    mats.lens.emissiveIntensity = on > 0 ? 0.5 + 2.0 * flash * on : 0.03
    mats.reflector.emissiveIntensity = on > 0 ? 0.3 + 1.2 * on : 0
    mats.bulb.color.set(on > 0 ? '#ffe2d8' : '#2a1210')
  })
  return (
    <>
      {/* hangs from the roof: mounting plate and base against the ceiling, glass lens below */}
      <group position={SIREN.position}>
        <mesh material={mats.base} position={[0, -0.006, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.012, 24]} />
        </mesh>
        <mesh material={mats.base} position={[0, -0.03, 0]}>
          <cylinderGeometry args={[0.072, 0.082, 0.04, 24]} />
        </mesh>
        {/* inside: bulb and a curved reflector going round */}
        <mesh material={mats.bulb} position={[0, -0.1, 0]}>
          <sphereGeometry args={[0.014, 12, 8]} />
        </mesh>
        <group ref={spinner} position={[0, -0.1, 0]}>
          <mesh material={mats.reflector} position={[-0.012, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.07, 16, 1, true, Math.PI / 2, Math.PI]} />
          </mesh>
        </group>
        {/* ribbed glass: straight sides and a rounded end */}
        <mesh material={mats.lens} position={[0, -0.09, 0]}>
          <cylinderGeometry args={[0.064, 0.068, 0.1, 28, 1, true]} />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
          <mesh key={k} material={mats.lens} position={[0, -0.09, 0]} rotation={[0, (k * Math.PI) / 4, 0]}>
            <boxGeometry args={[0.003, 0.1, 0.126]} />
          </mesh>
        ))}
        <mesh material={mats.lens} position={[0, -0.14, 0]}>
          <sphereGeometry args={[0.064, 28, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        </mesh>
      </group>
      {targets.map((t, k) => (
        <primitive key={`t${k}`} object={t} />
      ))}
      {targets.map((t, k) => (
        <spotLight
          key={k}
          ref={(el) => (beams.current[k] = el)}
          position={[x, lampY, z]}
          target={t}
          color={SIREN.color}
          intensity={0}
          distance={SIREN.distance}
          angle={SIREN.beamAngle}
          penumbra={SIREN.beamSoftness}
          decay={1.5}
        />
      ))}
      <pointLight ref={glow} position={[x, lampY - 0.2, z]} color={SIREN.color} intensity={0} distance={3} decay={2} />
    </>
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
  const fill = useRef<HemisphereLight>(null)
  const st = useRef({
    beat: 'depart' as Beat,
    since: -1,
    started: -1,
    seenAt: -1,
    nextFlicker: 0,
    flickerUntil: 0,
    said: new Set<string>(),
    lastMe: null as Vector3 | null,
    strikes: 0,
    closed: 0,
  })
  const tmp = useMemo(() => ({ frustum: new Frustum(), m: new Matrix4(), p: new Vector3() }), [])
  const start = useMemo(() => new Vector3(R.start.x, R.area.floorY, R.start.z), [])
  const seats = useMemo(() => findSeats(train), [train])
  const nearSeat = useRef<SeatSpot | null>(null)

  // C sits down on the seat you're next to, and C again stands up
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyC' || e.repeat || useGame.getState().paused || useGame.getState().inputLocked) return
      if (seat.active) {
        seat.active = false
        seat.changed = true
        return
      }
      const s = nearSeat.current
      if (!s) return
      Object.assign(seat, {
        active: true,
        changed: true,
        x: s.x - s.side * SEATS.sitInward, // a little in from the wall, over the cushion
        z: s.z,
        eye: s.y + SEATS.eyeAboveSeat - R.area.floorY,
        heading: s.side < 0 ? Math.PI / 2 : -Math.PI / 2, // facing across the carriage
        standX: CAR_X + s.side * SEATS.standFromCentre,
        standZ: s.z,
      })
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      seat.active = false
      useGame.getState().setPrompt(null)
    }
  }, [])

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
      resetFear()
      s.setCaption(null)
      s.setInputLocked(false)
      s.setTrainState('hidden')
    }
  }, [camera])

  useFrame(({ clock }, dt) => {
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
      // standing, he always faces you (walking, he faces where he's going)
      if (!isWalking(fig)) {
        const want = Math.atan2(me.x - fig.position.x, me.z - fig.position.z)
        fig.rotation.y += Math.atan2(Math.sin(want - fig.rotation.y), Math.cos(want - fig.rotation.y)) * Math.min(1, dt * 5)
      }
    }

    // He's in your carriage (not behind the end door): you can be reached
    const inYourCarriage = fig?.visible === true && fig.position.z < R.area.maxZ + 0.5 && fig.position.z > R.area.minZ - 0.5
    const near = inYourCarriage ? Math.hypot(me.x - fig!.position.x, me.z - fig!.position.z) : Infinity
    if (fig) fig.userData.seen = inView
    Object.assign(fearFocus, fig?.visible ? { active: true, x: fig.position.x, y: fig.position.y + 1.68, z: fig.position.z } : { active: false })

    // He reaches you: it's over. He never says a word.
    if (near < APPROACH.contact && !game.missed && s.beat !== 'cut') {
      game.fail(CAUGHT.heading, CAUGHT.line)
      seat.active = false
      return
    }

    // Walk at him and he comes to you
    if (fig && near < APPROACH.range && !game.panic) {
      // only your own steps count (him walking toward you doesn't)
      if (s.lastMe) {
        tmp.p.set(fig.position.x - me.x, 0, fig.position.z - me.z).normalize()
        s.closed += Math.max(0, (me.x - s.lastMe.x) * tmp.p.x + (me.z - s.lastMe.z) * tmp.p.z)
      }
      if (s.closed >= APPROACH.approachStep) {
        s.closed = 0
        // a step of his own, but he never closes the last stretch himself
        const k = Math.max(APPROACH.holdOff, near - APPROACH.stepToward) / Math.max(near, 0.001)
        walkTo(fig, me.x + (fig.position.x - me.x) * k, me.z + (fig.position.z - me.z) * k, FIGURE_WALK.toward)
        addFear(APPROACH.fearJump)
      }
    } else s.closed = 0
    s.lastMe = (s.lastMe ?? new Vector3()).copy(me)

    /** The carriage lights stutter; during the dark moment, `onDark` runs once. */
    const flicker = (onDark: () => void) => {
      if (now > s.nextFlicker) {
        s.flickerUntil = now + R.flickerDark
        const [lo, hi] = R.flickerEvery
        s.nextFlicker = now + lo + Math.random() * (hi - lo)
        onDark()
      }
      const dark = now < s.flickerUntil
      // a flicker only ever goes darker: the dim emergency light cuts out entirely
      trainLights.level = dark ? (Math.random() < 0.3 ? SIREN.carriageLight * 0.5 : 0) : s.beat === 'held' ? SIREN.carriageLight : 1
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
            stopWalking(fig) // the lights are out: he can be anywhere
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

    // Sit / stand prompt when you're next to a seat
    let nearest: SeatSpot | null = null
    let best = SEATS.reach
    for (const seatSpot of seats) {
      const d = Math.hypot(me.x - seatSpot.x, me.z - seatSpot.z)
      if (d < best) {
        best = d
        nearest = seatSpot
      }
    }
    nearSeat.current = nearest
    const prompt = s.beat === 'cut' ? null : seat.active ? SEATS.standPrompt : nearest ? SEATS.sitPrompt : null
    if (game.prompt !== prompt) game.setPrompt(prompt)
    if (s.beat === 'doors' && seat.active) {
      seat.active = false // stand up for your stop
      seat.changed = true
    }

    // During the emergency everything else dims, so the siren's red carries the scene
    if (fill.current) fill.current.intensity = FILL * (1 - (1 - SIREN.ambient) * siren.current)

    if (s.beat !== 'brake') cameraShake.amount = TUNNEL.shake * speed.current
    setTrainRun(s.beat === 'cut' ? 0 : speed.current)
    // Fear: rises with him near and in sight. In the train there's nowhere safe.
    const fearDist = fig?.visible ? (inYourCarriage ? near : dist) : Infinity
    if (stepFear(now, Math.min(dt, 0.1), fearDist, inView, false) === 'panic' && fig && inYourCarriage) {
      s.strikes += 1
      if (s.strikes >= FEAR.strikes) {
        // third time: you can't move at all, and he walks all the way to you
        freezeForGood()
        walkTo(fig, me.x, me.z, FIGURE_WALK.toward)
      } else {
        // he walks a little closer and stops; then you can move again
        const k = Math.max(APPROACH.holdOff, near - FEAR.panicStep) / Math.max(near, 0.001)
        walkTo(fig, me.x + (fig.position.x - me.x) * k, me.z + (fig.position.z - me.z) * k, FIGURE_WALK.toward)
      }
      game.setThought(FEAR.lastLines[Math.min(s.strikes, FEAR.lastLines.length) - 1])
    }
  })

  return (
    <>
      <color attach="background" args={['#000']} />
      <fog attach="fog" args={['#000000', 4, 40]} />
      <hemisphereLight ref={fill} args={['#1b2420', '#050505', FILL]} />
      <Train />
      <Tunnel speed={speed} />
      <Siren level={siren} />
      <Figure ref={figure} />
      <FreeRoam area={R.area} collide={train} start={start} startHeading={MathUtils.degToRad(R.start.headingDeg)} />
    </>
  )
}
