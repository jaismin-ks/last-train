import { Canvas } from '@react-three/fiber'
import { SheetProvider } from '@theatre/r3f'
import { Suspense } from 'react'
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
import { useEffect, useLayoutEffect, useRef } from 'react'
import type { RootState } from '@react-three/fiber'
import { Station } from './scenes/Station'
import { Ride } from './scenes/Ride'

/** The phone scene happens far below the street, hidden in the black fog. */
const PHONE_RIG_Y = -300

export function Experience() {
  const phase = useGame((s) => s.phase)
  const paused = useGame((s) => s.paused)
  const attempt = useGame((s) => s.attempt)
  const three = useRef<RootState | null>(null)
  // Pausing switches the 3D loop off, and three/fiber resets its clock to zero when it
  // does (and again on resume). Every scene times its beats on that clock, so keep the
  // time it had when paused, and skip the time spent paused so nothing jumps.
  const pausedAt = useRef<number | null>(null)
  useEffect(
    () =>
      useGame.subscribe((s, prev) => {
        if (s.paused && !prev.paused && three.current) pausedAt.current = three.current.clock.elapsedTime
      }),
    [],
  )
  // a layout effect: runs after the Canvas applies the new frameloop, before the next frame
  useLayoutEffect(() => {
    const clock = three.current?.clock
    if (paused || !clock) return
    if (pausedAt.current !== null) clock.elapsedTime = pausedAt.current
    ;(clock as unknown as { oldTime: number }).oldTime = performance.now()
    pausedAt.current = null
  }, [paused])
  const showPhone = phase === 'phoneIntro'
  // Mounted early (hidden) so the street is ready the moment the descent starts
  const showStreet = phase === 'phoneIntro' || phase === 'descent' || phase === 'street'

  return (
    <>
    <Canvas camera={{ position: [0, PHONE_RIG_Y, 0.32], fov: 35, near: 0.01, far: 500 }}
      frameloop={paused ? 'never' : 'always'}
      onCreated={(state) => {
        three.current = state
        if (import.meta.env.DEV) (window as unknown as { __three: typeof state }).__three = state // dev: lets tests inspect the camera
      }} dpr={[1, 2]}>
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
    <Fader />
    </>
  )
}
