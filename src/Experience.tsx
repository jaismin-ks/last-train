import { Canvas } from '@react-three/fiber'
import { SheetProvider } from '@theatre/r3f'
import { Suspense } from 'react'
import { sheets } from './theatre/project'
import { useGame } from './store'
import { PhoneIntro } from './scenes/PhoneIntro'
import { Descent } from './scenes/Descent'
import { Fader } from './ui/Fader'

/** The phone scene happens far below the street, hidden in the black fog. */
const PHONE_RIG_Y = -300

export function Experience() {
  const phase = useGame((s) => s.phase)
  const showPhone = phase === 'phoneIntro'
  // Mounted early (hidden) so the street is ready the moment the descent starts
  const showStreet = phase === 'phoneIntro' || phase === 'descent' || phase === 'street'

  return (
    <>
    <Canvas camera={{ position: [0, PHONE_RIG_Y, 0.32], fov: 35, near: 0.01, far: 500 }} dpr={[1, 2]}>
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
      </Suspense>
    </Canvas>
    <Fader />
    </>
  )
}
