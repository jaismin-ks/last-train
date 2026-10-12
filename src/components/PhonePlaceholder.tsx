import type { Texture } from 'three'

// iPhone-ish proportions in metres (393 × 852 screen ratio)
const W = 0.0716
const H = 0.155

/** Stand-in phone until the real model is added. */
export function PhonePlaceholder({ screen }: { screen: Texture }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[W + 0.006, H + 0.006, 0.008]} />
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.0041]}>
        <planeGeometry args={[W, H]} />
        {/* toneMapped off so the screen glows like a real display */}
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
    </group>
  )
}
