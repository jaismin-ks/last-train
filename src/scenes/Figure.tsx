import { forwardRef, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  AdditiveBlending,
  AnimationMixer,
  CanvasTexture,
  Color,
  LoopRepeat,
  MeshBasicMaterial,
  ShaderMaterial,
  SkinnedMesh,
  Sprite,
  SpriteMaterial,
  Vector3,
  type AnimationAction,
  type Group,
  type Mesh,
  type Object3D,
} from 'three'
import { clone as cloneRigged } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { DRACO } from '../data/street'

/** Rigged, with two animations: Idle (standing, breathing) and Walk (in place, two steps). */
const FIGURE_MODEL = '/assets/models/figure-rigged.glb'
/** Walking speed (m/s) the Walk animation's stride matches at normal playback speed. */
const WALK_CLIP_SPEED = 1.2

/**
 * How he looks. Body: unlit black (no light ever reveals a face or clothes),
 * blurred out at the edges into a smoky haze, like a shadow out of focus.
 * Eyes: white glow that stays visible from far down the platform.
 */
export const FIGURE_LOOK = {
  /** Solid core: how much of the outline fades away (0 hard → 1 fully soft). */
  coreSoftness: 1,
  coreFalloff: 1.3, // lower = the fade reaches further into the body
  /** Haze around him: [metres out from the body, opacity] per layer. */
  haze: [
    [0.025, 0.4],
    [0.06, 0.22],
    [0.11, 0.12],
    [0.18, 0.06],
  ] as [number, number][],
  hazeDrift: 0.35, // how fast the haze shifts (smoky movement)
  eyeColor: '#f4fff8',
  eyeGlowSize: 0.075, // metres across each eye's halo up close
  eyeGlowMinAngle: 0.0035, // halo never smaller than this × distance (still visible far away)
  eyeGlowStrength: 0.9,
  blinkEvery: [4, 9] as [number, number], // seconds between blinks (random in range)
  blinkTime: 0.14,
}

// Skinned: the body (and its haze) bends with the walk
const vertexShader = /* glsl */ `
  #include <common>
  #include <skinning_pars_vertex>
  uniform float inflate;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;
  void main() {
    #include <skinbase_vertex>
    #include <beginnormal_vertex>
    #include <skinnormal_vertex>
    #include <begin_vertex>
    transformed += normal * inflate;
    vPos = transformed;
    #include <skinning_vertex>
    vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
    vNormal = normalize(normalMatrix * objectNormal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`

const fragmentShader = /* glsl */ `
  uniform float opacity;
  uniform float falloff;
  uniform float softness;
  uniform float time;
  uniform float noisy;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;
  // cheap 3D value noise
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float edge = pow(1.0 - facing, falloff);
    float a = opacity * (1.0 - edge * softness);
    // the haze drifts and breaks up like smoke
    float n = noise(vPos * 7.0 + vec3(0.0, time, time * 0.6));
    a *= mix(1.0, smoothstep(0.15, 0.85, n), noisy);
    gl_FragColor = vec4(0.0, 0.0, 0.0, a);
  }`

function bodyMaterial(inflate: number, opacity: number, haze: boolean) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: !haze, // haze layers never hide each other
    uniforms: {
      inflate: { value: inflate },
      opacity: { value: opacity },
      falloff: { value: haze ? 0.8 : FIGURE_LOOK.coreFalloff },
      softness: { value: haze ? 1 : FIGURE_LOOK.coreSoftness },
      time: { value: 0 },
      noisy: { value: haze ? 1 : 0 },
    },
    vertexShader,
    fragmentShader,
  })
}

/** Soft round glow for the eyes (drawn on a small canvas once). */
function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.2, 'rgba(255,255,255,0.55)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return new CanvasTexture(c)
}

/**
 * The man on the platform: a real body shape, but all black and blurred
 * like a shadow, with glowing white eyes. Origin at his feet; he faces +z and
 * the story turns him toward you. Rigged and animated in Blender
 * (assets-src/blender/figure.blend: Idle + Walk; figure-original.blend is the raw download).
 */
/**
 * Movement the story asks for: he walks to (x, z) at `speed` m/s. With
 * `freezeWhenSeen`, he stops dead (mid-step) whenever you're looking at him
 * (the story sets userData.seen every frame).
 */
export type FigureWalk = { x: number; z: number; speed: number; freezeWhenSeen: boolean }
export function walkTo(fig: Object3D, x: number, z: number, speed: number, freezeWhenSeen = false) {
  fig.userData.walk = { x, z, speed, freezeWhenSeen } satisfies FigureWalk
}
/** Stand still where he is. */
export const stopWalking = (fig: Object3D) => (fig.userData.walk = null)
/** True while he's on his way somewhere. */
export const isWalking = (fig: Object3D) => !!fig.userData.walk

export const Figure = forwardRef<Group>(function Figure(_, ref) {
  const { scene, animations } = useGLTF(FIGURE_MODEL, DRACO)
  const anim = useRef<{ mixer: AnimationMixer; idle: AnimationAction; walk: AnimationAction; walkWeight: number } | null>(null)
  const eyes = useRef<Mesh[]>([])
  const glows = useRef<Sprite[]>([])
  const blink = useRef({ next: 3, until: 0 })
  const tmp = useMemo(() => new Vector3(), [])

  const mats = useMemo(() => {
    const tex = glowTexture()
    return {
      core: bodyMaterial(0, 1, false),
      haze: FIGURE_LOOK.haze.map(([out, a]) => bodyMaterial(out, a, true)),
      eye: new MeshBasicMaterial({ color: new Color(FIGURE_LOOK.eyeColor), toneMapped: false, fog: false }),
      glow: new SpriteMaterial({
        map: tex,
        color: new Color(FIGURE_LOOK.eyeColor),
        opacity: FIGURE_LOOK.eyeGlowStrength,
        blending: AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    }
  }, [])

  const model = useMemo(() => {
    const root = cloneRigged(scene) // keeps the skeleton working on the copy
    const found: Mesh[] = []
    const sprites: Sprite[] = []
    let body: SkinnedMesh | null = null
    root.traverse((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      if (mesh.name.startsWith('LT_Eye')) {
        mesh.material = mats.eye
        mesh.renderOrder = 3
        const glow = new Sprite(mats.glow)
        glow.position.z = 0.05 // just in front of the face so the head doesn't clip it
        glow.renderOrder = 4
        mesh.add(glow)
        sprites.push(glow)
        found.push(mesh)
      } else if ((mesh as SkinnedMesh).isSkinnedMesh) body = mesh as SkinnedMesh
    })
    if (body) {
      const b = body as SkinnedMesh
      b.material = mats.core
      b.renderOrder = 1
      b.frustumCulled = false // the walk moves him outside his resting bounds
      // haze shells: the same body on the same skeleton, slightly bigger each time and fainter
      mats.haze.forEach((m) => {
        const shell = new SkinnedMesh(b.geometry, m)
        shell.bind(b.skeleton, b.bindMatrix)
        shell.position.copy(b.position)
        shell.quaternion.copy(b.quaternion)
        shell.scale.copy(b.scale)
        shell.renderOrder = 2
        shell.frustumCulled = false
        b.parent?.add(shell)
      })
    }
    eyes.current = found
    glows.current = sprites

    // Idle and Walk both run all the time; their weights decide which you see
    const mixer = new AnimationMixer(root)
    const clip = (name: string) => animations.find((a) => a.name === name) ?? animations[0]
    const idle = mixer.clipAction(clip('Idle'), root).setLoop(LoopRepeat, Infinity).play()
    const walk = mixer.clipAction(clip('Walk'), root).setLoop(LoopRepeat, Infinity).play()
    walk.setEffectiveWeight(0)
    anim.current = { mixer, idle, walk, walkWeight: 0 }
    return root
  }, [scene, animations, mats])

  useEffect(
    () => () => {
      mats.core.dispose()
      mats.haze.forEach((m) => m.dispose())
      mats.eye.dispose()
      mats.glow.map?.dispose()
      mats.glow.dispose()
      anim.current?.mixer.stopAllAction()
    },
    [mats],
  )

  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime
    // Walking: toward the story's target, unless you're looking and he's creeping
    const root = model.parent
    const walk = root?.userData.walk as FigureWalk | null | undefined
    let stepping = false
    let frozenMidStep = false
    if (root && walk) {
      const dx = walk.x - root.position.x
      const dz = walk.z - root.position.z
      const d = Math.hypot(dx, dz)
      if (d < 0.03) root.userData.walk = null
      else if (walk.freezeWhenSeen && root.userData.seen) frozenMidStep = true
      else {
        const step = Math.min(d, walk.speed * Math.min(dt, 0.1))
        root.position.x += (dx / d) * step
        root.position.z += (dz / d) * step
        // face the way he's walking (turning smoothly)
        const want = Math.atan2(dx, dz)
        const turn = Math.atan2(Math.sin(want - root.rotation.y), Math.cos(want - root.rotation.y))
        root.rotation.y += turn * Math.min(1, dt * 6)
        stepping = true
      }
    }
    root && (root.userData.stepping = stepping)
    root && (root.userData.frozenMidStep = frozenMidStep)

    // Walk while moving; caught mid-creep he freezes mid-step; otherwise he stands
    const a = anim.current
    if (a) {
      const target = stepping || frozenMidStep ? 1 : 0
      a.walkWeight += (target - a.walkWeight) * Math.min(1, dt * 6)
      a.walk.setEffectiveWeight(a.walkWeight)
      a.idle.setEffectiveWeight(1 - a.walkWeight)
      a.walk.timeScale = frozenMidStep ? 0 : (walk?.speed ?? WALK_CLIP_SPEED) / WALK_CLIP_SPEED
      a.mixer.update(Math.min(dt, 0.1))
    }
    for (const m of mats.haze) m.uniforms.time.value = t * FIGURE_LOOK.hazeDrift
    // Now and then he blinks: the eyes go out for a moment
    const b = blink.current
    if (t > b.next) {
      b.until = t + FIGURE_LOOK.blinkTime
      const [lo, hi] = FIGURE_LOOK.blinkEvery
      b.next = t + lo + Math.random() * (hi - lo)
    }
    // eyes stay shut while he's lurking (the story sets userData.eyesOpen)
    const open = t > b.until && model.parent?.userData.eyesOpen !== false
    for (const e of eyes.current) e.visible = open
    // Eye halos keep a minimum size on screen, so they still show far away
    for (const g of glows.current) {
      const d = g.getWorldPosition(tmp).distanceTo(camera.position)
      g.scale.setScalar(Math.max(FIGURE_LOOK.eyeGlowSize, d * FIGURE_LOOK.eyeGlowMinAngle))
    }
  })

  return (
    <group ref={ref} visible={false}>
      <primitive object={model} />
    </group>
  )
})

useGLTF.preload(FIGURE_MODEL, DRACO)
