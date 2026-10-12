import { Canvas } from '@react-three/fiber'
import { SheetProvider } from '@theatre/r3f'
import { Suspense } from 'react'
import { sheets } from './theatre/project'
import { useGame } from './store'
import { PhoneIntro } from './scenes/PhoneIntro'

export function Experience() {
  const phase = useGame((s) => s.phase)

  return (
    <Canvas camera={{ position: [0, 0, 0.6], fov: 35 }} dpr={[1, 2]}>
      <color attach="background" args={['#000']} />
      <Suspense fallback={null}>
        {phase === 'phoneIntro' && (
          <SheetProvider sheet={sheets.phoneIntro}>
            <PhoneIntro />
          </SheetProvider>
        )}
      </Suspense>
    </Canvas>
  )
}
