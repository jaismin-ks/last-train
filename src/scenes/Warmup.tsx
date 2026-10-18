import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type { Light, Material, Mesh, Object3D, Texture } from 'three'
import { useGame } from '../store'

/**
 * A scene arriving: before its first frame, its materials are built and its
 * textures and meshes sent to the graphics card. On a slow computer that takes a
 * while, and done during the first frame it froze the fade in. So the clock holds
 * (nothing starts, the countdown doesn't run) and the loading screen says `label`
 * until it's ready; then the scene starts as if it had just arrived.
 */
export function Warmup({ label }: { label: string }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const setFrameloop = useThree((s) => s.setFrameloop)
  const get = useThree((s) => s.get)

  useLayoutEffect(() => {
    let live = true
    useGame.getState().setLoading(label) // (first: the clock's time is kept as it stops)
    setFrameloop('never') // now, not a render later
    get().internal.frames = 0 // (and no frame left queued: it would run on a clock in milliseconds)
    // after the scene's own setup (its materials tweaked, helpers hidden)
    const t = setTimeout(async () => {
      // things hidden for later (the train, him) too, so they don't stall when they appear;
      // lights stay as they are (how many there are is part of every material)
      const shown: Object3D[] = []
      scene.traverse((o) => {
        if (o.visible || (o as Light).isLight) return
        o.visible = true
        shown.push(o)
      })
      try {
        await gl.compileAsync(scene, camera)
      } catch {
        // the first frame builds whatever's left
      }
      for (const o of shown) o.visible = false
      if (!live) return
      const textures = new Set<Texture>()
      scene.traverse((o) => {
        const mats = (o as Mesh).material
        for (const m of (Array.isArray(mats) ? mats : [mats]) as Material[])
          for (const v of Object.values(m ?? {})) if ((v as Texture)?.isTexture) textures.add(v as Texture)
      })
      textures.forEach((tex) => gl.initTexture(tex))
      gl.render(scene, camera) // sends the meshes (under the black)
      useGame.getState().setLoading(null)
    }, 0)
    return () => {
      live = false
      clearTimeout(t)
      useGame.getState().setLoading(null)
    }
  }, [gl, scene, camera, label, setFrameloop, get])

  return null
}
