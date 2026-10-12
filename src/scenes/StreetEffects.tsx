import { BrightnessContrast, ChromaticAberration, EffectComposer, HueSaturation, Vignette } from '@react-three/postprocessing'
import { Vector2 } from 'three'

/** Camera effects for the street: colour grade, dark edges, film grain, slight colour fringing. */
export const STREET_EFFECTS = {
  vignetteOffset: 0.1, // how far in the darkening starts (lower = wider dark edges)
  vignetteDarkness: 1.0, // how dark the edges get (0–1)
  fringe: 0.0012, // colour fringing at the edges (chromatic aberration)
  saturation: -0.35, // drained colours (-1 = black and white)
  contrast: 0.18, // deeper blacks
}

const FRINGE = new Vector2(STREET_EFFECTS.fringe, STREET_EFFECTS.fringe)

export function StreetEffects() {
  return (
    <EffectComposer>
      <HueSaturation saturation={STREET_EFFECTS.saturation} />
      <BrightnessContrast contrast={STREET_EFFECTS.contrast} />
      <ChromaticAberration offset={FRINGE} radialModulation modulationOffset={0.3} />
      <Vignette offset={STREET_EFFECTS.vignetteOffset} darkness={STREET_EFFECTS.vignetteDarkness} eskil={false} />
    </EffectComposer>
  )
}
