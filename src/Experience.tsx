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
import { StaminaBar } from './ui/StaminaBar'
import { useEffect, useRef } from 'react'
import type { RootState } from '@react-three/fiber'
import { Station } from './scenes/Station'

/** The phone scene happens far below the street, hidden in the black fog. */
const PHONE_RIG_Y = -300

export function Experience() {
  const phase = useGame((s) => s.phase)
  const paused = useGame((s) => s.paused)
  const three = useRef<RootState | null>(null)
  // On resume, skip the time spent paused so cutscenes and walking don't jump
  useEffect(() => {
    if (!paused && three.current) (three.current.clock as unknown as { oldTime: number }).oldTime = performance.now()
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
        {showStreet && <Descent />}
        {phase === 'platform' && <Station />}
      </Suspense>
    </Canvas>
    <Caption />
    <Thought />
    <LocationCard />
    <PauseMenu />
    <StaminaBar />
    <Prompt />
    <Fader />
    </>
  )
}
