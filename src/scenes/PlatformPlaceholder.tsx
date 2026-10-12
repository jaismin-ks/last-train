import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type { PerspectiveCamera } from 'three'
import { SCENE_FADE } from '../data/street'
import { useGame } from '../store'
import { setFootsteps, stopAmbience } from '../audio/sounds'

/**
 * Stand-in for the subway platform until the real scene is built:
 * a dim tiled floor under one green fluorescent tube. Fades in from black.
 */
export function PlatformPlaceholder() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const setBlackout = useGame((s) => s.setBlackout)
  const start = useRef<number | null>(null)

  // Street sounds never carry into the station
  useEffect(() => {
    stopAmbience(300)
    setFootsteps(0)
  }, [])

  useEffect(() => {
    camera.position.set(0, 1.6, 6)
    camera.fov = 60
    camera.updateProjectionMatrix()
    camera.lookAt(0, 1.4, -10)
  }, [camera])

  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime
    const k = Math.min(1, (clock.elapsedTime - start.current) / SCENE_FADE.in)
    setBlackout(1 - k)
  })

  return (
    <>
      <color attach="background" args={['#010302']} />
      <fog attach="fog" args={['#010302', 4, 26]} />
      <ambientLight intensity={0.15} color="#5fffc4" />
      <rectAreaLight position={[0, 3.2, 0]} rotation={[-Math.PI / 2, 0, 0]} width={0.3} height={4} intensity={6} color="#9dffd8" />
      <mesh position={[0, 3.25, 0]}>
        <boxGeometry args={[0.2, 0.06, 4]} />
        <meshBasicMaterial color="#d8fff0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 40]} />
        <meshStandardMaterial color="#1b2420" roughness={0.6} />
      </mesh>
      <Text position={[0, 1.6, -4]} fontSize={0.22} color="#7da897" anchorX="center">
        PLATFORM — placeholder (next scene)
      </Text>
    </>
  )
}
