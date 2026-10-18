import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useFrame, useThree, type ThreeElements } from '@react-three/fiber'
import { MathUtils, Vector3, type PointLight } from 'three'

/**
 * The station has ~40 lights, and every light costs every lit pixel, every
 * frame, whether it reaches that pixel or not. Changing how many there are also
 * makes the GPU rebuild every material (a freeze of a second or more on a slow
 * computer). So the station's lights aren't in the scene themselves: they're
 * stand-ins (hidden, still animated as before), and a fixed handful of real lights
 * follows the ones nearest to you. Far ones are lost in the fog anyway.
 */
export const POOL = {
  size: 12, // real lights
  fade: 6, // metres: the farthest picked lights dim out as they're about to be swapped
}

const sources = new Set<PointLight>()

/**
 * A station light: drawn by the pool when it's near you. Takes the same props (and ref)
 * as a pointLight. `pooled={false}`: just a real light (the train's, on the ride: no pool there).
 */
export const PooledLight = forwardRef<PointLight, ThreeElements['pointLight'] & { pooled?: boolean }>(function PooledLight(
  { pooled = true, ...props },
  ref,
) {
  const own = useRef<PointLight>(null!)
  useImperativeHandle(ref, () => own.current)
  useEffect(() => {
    if (!pooled) return
    const light = own.current
    sources.add(light)
    return () => void sources.delete(light)
  }, [pooled])
  return <pointLight ref={own} {...props} visible={!pooled} />
})

const at = new Vector3()
const ranked: { light: PointLight; d: number }[] = []

/** The real lights. Mount once per scene that uses PooledLight. */
export function LightPool() {
  const camera = useThree((s) => s.camera)
  const slots = useRef<(PointLight | null)[]>([])

  useFrame(() => {
    ranked.length = 0
    for (const light of sources) ranked.push({ light, d: at.setFromMatrixPosition(light.matrixWorld).distanceTo(camera.position) })
    ranked.sort((a, b) => a.d - b.d)
    // the nearest one left out: the picked ones fade as they get as far as it
    const cutoff = ranked[POOL.size]?.d ?? Infinity
    slots.current.forEach((slot, i) => {
      const pick = ranked[i]
      if (!slot) return
      if (!pick) {
        slot.intensity = 0
        return
      }
      const src = pick.light
      slot.position.setFromMatrixPosition(src.matrixWorld)
      slot.color.copy(src.color)
      slot.distance = src.distance
      slot.decay = src.decay
      slot.intensity = src.intensity * MathUtils.clamp((cutoff - pick.d) / POOL.fade, 0, 1)
    })
  })

  return (
    <>
      {Array.from({ length: POOL.size }, (_, i) => (
        <pointLight key={i} ref={(el) => void (slots.current[i] = el)} intensity={0} decay={2} />
      ))}
    </>
  )
}
