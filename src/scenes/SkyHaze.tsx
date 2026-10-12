import { useMemo } from 'react'
import { BackSide, Color, ShaderMaterial } from 'three'
import { HAZE } from '../data/street'

/**
 * A huge inside-out sphere around the city that tints the night sky with mist:
 * thick at the horizon, thinning out higher up. (Scene fog doesn't touch the
 * sky background, so this is what makes the sky hazy.)
 */
export function SkyHaze({ opacity = 1 }: { opacity?: number }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        transparent: true,
        depthWrite: false,
        fog: false,
        uniforms: {
          uColor: { value: new Color(HAZE.color) },
          uStrength: { value: HAZE.strength },
          uHeight: { value: HAZE.height },
          uOpacity: { value: opacity },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uStrength;
          uniform float uHeight;
          uniform float uOpacity;
          varying vec3 vDir;
          void main() {
            // 1 at the horizon, fading to 0 by uHeight up the sky
            float h = clamp(vDir.y / uHeight, 0.0, 1.0);
            float a = (1.0 - smoothstep(0.0, 1.0, h)) * uStrength * uOpacity;
            gl_FragColor = vec4(uColor, a);
          }`,
      }),
    [],
  )
  material.uniforms.uOpacity.value = opacity

  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[400, 32, 16]} />
    </mesh>
  )
}
