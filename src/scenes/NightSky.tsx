import { useEffect } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import { EquirectangularReflectionMapping } from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { NIGHT_SKY } from '../data/street'

/**
 * Night sky as the scene background. `intensity` 0 → black, 1 → full stars,
 * so the descent can fade it in.
 */
export function NightSky({ intensity }: { intensity: number }) {
  const texture = useLoader(EXRLoader, NIGHT_SKY)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    texture.mapping = EquirectangularReflectionMapping
    scene.background = texture
    return () => {
      scene.background = null
    }
  }, [scene, texture])

  useEffect(() => {
    scene.backgroundIntensity = intensity
  }, [scene, intensity])

  return null
}

useLoader.preload(EXRLoader, NIGHT_SKY)
