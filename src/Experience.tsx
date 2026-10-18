import { Canvas } from '@react-three/fiber'
import { SheetProvider } from '@theatre/r3f'
import { Suspense, useState } from 'react'
import { PerformanceMonitor, useProgress } from '@react-three/drei'
import { useLoad } from './systems/loadProgress'
import { sheets } from './theatre/project'
import { useGame } from './store'
import { PhoneIntro } from './scenes/PhoneIntro'
import { Descent } from './scenes/Descent'
import { Fader } from './ui/Fader'
import { Prompt } from './ui/Prompt'
import { Caption } from './ui/Caption'
import { Thought } from './ui/Thought'
import { LocationCard } from './ui/LocationCard'
import { PauseMenu } from './ui/PauseMenu'
import { Missed, Timer } from './ui/Timer'
import { FearVignette } from './ui/FearVignette'
import { RitualOverlay } from './ui/RitualOverlay'
import { SoundCaption } from './ui/SoundCaption'
import { StaminaBar } from './ui/StaminaBar'
import { TouchControls } from './ui/TouchControls'
import { SceneLoading } from './ui/SceneLoading'
import { useEffect, useLayoutEffect, useRef } from 'react'
import type { RootState } from '@react-three/fiber'
import { Station } from './scenes/Station'
import { Ride } from './scenes/Ride'

/**
 * Rendering resolution (device pixel ratio). High-DPI screens cost 4x the pixels
 * at 2x, so the 3D scenes are capped at 1.5 and step down to the screen's own
 * size (1) if the frame rate drops, back up when there's headroom. Never below 1
 * (blurry). The phone scene is cheap and all text, so it always gets full sharpness.
 */
const SCREEN_DPR = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
const DPR = { max: Math.min(SCREEN_DPR, 1.5), min: Math.min(SCREEN_DPR, 1), step: 0.25, phone: Math.min(SCREEN_DPR, 2) }

// the loading and start screens show how the downloads are going (they don't load the 3D code themselves)
const report = ({ active, progress, total }: ReturnType<typeof useProgress.getState>) => useLoad.setState({ active, progress, total })
report(useProgress.getState())
useProgress.subscribe(report)

/** The phone scene happens far below the street, hidden in the black fog. */
const PHONE_RIG_Y = -300

export function Experience() {
  const phase = useGame((s) => s.phase)
  // also held while a scene gets ready (see Warmup)
  const halted = useGame((s) => s.paused || s.loading !== null)
  const attempt = useGame((s) => s.attempt)
  const three = useRef<RootState | null>(null)
  const [dpr, setDpr] = useState(DPR.max)
  // Pausing (or a scene getting ready) switches the 3D loop off, and three/fiber resets its
  // clock to zero when it does (and again on resume). Every scene times its beats on that
  // clock, so keep the time it had when paused, and skip the time spent paused so nothing jumps.
  const pausedAt = useRef<number | null>(null)
  useEffect(
    () =>
      useGame.subscribe((s, prev) => {
        const held = (g: typeof s) => g.paused || g.loading !== null
        // (only the first time: one scene handing the hold to the next lets go for a moment)
        if (held(s) && !held(prev) && three.current && pausedAt.current === null) pausedAt.current = three.current.clock.elapsedTime
      }),
    [],
  )
  // a layout effect: runs after the Canvas applies the new frameloop, before the next frame
  useLayoutEffect(() => {
    const clock = three.current?.clock
    // a frame still queued when the loop stops runs anyway, with the clock in milliseconds
    // (every timer would jump): drop it
    if (halted && three.current) three.current.internal.frames = 0
    if (halted || !clock) return
    if (pausedAt.current !== null) clock.elapsedTime = pausedAt.current
    ;(clock as unknown as { oldTime: number }).oldTime = performance.now()
    pausedAt.current = null
  }, [halted])
  const showPhone = phase === 'phoneIntro'
  // Mounted early (hidden) so the street is ready the moment the descent starts
  const showStreet = phase === 'phoneIntro' || phase === 'descent' || phase === 'street'

  return (
    <>
    <Canvas camera={{ position: [0, PHONE_RIG_Y, 0.32], fov: 35, near: 0.01, far: 500 }}
      frameloop={halted ? 'never' : 'always'}
      onCreated={(state) => {
        three.current = state
        if (import.meta.env.DEV) (window as unknown as { __three: typeof state }).__three = state // dev: lets tests inspect the camera
      }} dpr={showPhone ? DPR.phone : dpr} gl={{ powerPreference: 'high-performance' }}>
      {/* judged only in the walking scenes (the phone scene's frames dip while the street loads behind it) */}
      {!showPhone && (
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(DPR.min, d - DPR.step))}
          onIncline={() => setDpr((d) => Math.min(DPR.max, d + DPR.step))}
        />
      )}
      <color attach="background" args={['#000']} />
      <Suspense fallback={null}>
        {showPhone && (
          <SheetProvider sheet={sheets.phoneIntro}>
            <PhoneIntro />
          </SheetProvider>
        )}
      </Suspense>
      {/* Own boundary, so the phone never blanks out while the street finishes loading */}
      <Suspense fallback={null}>
        {/* `attempt` remounts the section on Try again (after missing the train) */}
        {showStreet && <Descent key={`street-${attempt}`} />}
        {phase === 'platform' && <Station key={`station-${attempt}`} />}
        {phase === 'ride' && <Ride key={`ride-${attempt}`} />}
      </Suspense>
    </Canvas>
    <FearVignette />
    <RitualOverlay />
    <SoundCaption />
    <Caption />
    <Thought />
    <LocationCard />
    <PauseMenu />
    <Timer />
    <Missed />
    <StaminaBar />
    <Prompt />
    <TouchControls />
    <Fader />
    <SceneLoading />
    </>
  )
}
