import { useLayoutEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CubeCamera, WebGLCubeRenderTarget, type Material, type Mesh, type Texture } from 'three'
import { useGame } from '../store'

/**
 * A scene arriving: its materials are built and its textures and meshes sent to the
 * graphics card before you see it. On a slow computer that takes a while, and done
 * in the middle of a frame it froze the game.
 *
 * `hold` (the default): the clock holds while it happens (nothing starts, the countdown
 * doesn't run), with the loading card saying `label` if there is one; then the scene
 * starts as if it had just arrived. `hold={false}`: done in the background while the
 * game plays on (the street, getting ready during the phone scene).
 *
 * Only on arrival: changing the props later does nothing.
 */
export function Warmup({ label, hold = true }: { label?: string; hold?: boolean }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const setFrameloop = useThree((s) => s.setFrameloop)
  const get = useThree((s) => s.get)
  const first = useRef({ label, hold })

  useLayoutEffect(() => {
    const { label, hold } = first.current
    let live = true
    if (hold) {
      useGame.getState().setLoading(label ?? '') // (first: the clock's time is kept as it stops)
      setFrameloop('never') // now, not a render later
      get().internal.frames = 0 // (and no frame left queued: it would run on a clock in milliseconds)
    }
    const breathe = () => new Promise((r) => setTimeout(r, 0))
    // after the scene's own setup (its materials tweaked, helpers hidden)
    const t = setTimeout(async () => {
      try {
        // every material, hidden ones too (the train, him), built off the main thread where the browser can
        await gl.compileAsync(scene, camera)
      } catch {
        // the first frame builds whatever's left
      }
      if (!live) return
      const textures = new Set<Texture>()
      scene.traverse((o) => {
        const mats = (o as Mesh).material
        for (const m of (Array.isArray(mats) ? mats : [mats]) as Material[])
          for (const v of Object.values(m ?? {})) if ((v as Texture)?.isTexture) textures.add(v as Texture)
      })
      let n = 0
      for (const tex of textures) {
        gl.initTexture(tex)
        if (!hold && ++n % 4 === 0) await breathe() // a few at a time, between frames
        if (!live) return
      }
      // the meshes all around (not just in view): a tiny six-sided snapshot from where the camera is
      const target = new WebGLCubeRenderTarget(16)
      const cube = new CubeCamera(0.05, 1000, target)
      cube.position.copy(camera.position)
      cube.update(gl, scene)
      target.dispose()
      if (hold) useGame.getState().setLoading(null)
    }, 0)
    return () => {
      live = false
      clearTimeout(t)
      if (hold) useGame.getState().setLoading(null)
    }
  }, [gl, scene, camera, setFrameloop, get])

  return null
}
