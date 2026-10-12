import { useMemo } from 'react'

/**
 * Film grain over the whole game (every scene and screen). A small noise tile
 * is generated once and jittered in steps with CSS, so it costs almost nothing.
 */
export const GRAIN = {
  opacity: 0.09, // grain strength
  size: 200, // tile size in px (smaller = finer grain)
  fps: 10, // how many times a second the grain changes
}

function makeNoise(size: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL('image/png')
}

export function FilmGrain() {
  const url = useMemo(() => makeNoise(GRAIN.size), [])
  const steps = 8
  return (
    <>
      <style>{`
        @keyframes lt-grain {
          ${Array.from({ length: steps }, (_, k) => {
            const x = Math.round(Math.random() * GRAIN.size)
            const y = Math.round(Math.random() * GRAIN.size)
            return `${(k / steps) * 100}% { transform: translate(-${x}px, -${y}px) }`
          }).join('\n')}
        }
      `}</style>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: `-${GRAIN.size}px`,
          backgroundImage: `url(${url})`,
          backgroundSize: `${GRAIN.size}px ${GRAIN.size}px`,
          opacity: GRAIN.opacity,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          zIndex: 50,
          animation: `lt-grain ${steps / GRAIN.fps}s steps(1) infinite`,
          willChange: 'transform',
        }}
      />
    </>
  )
}
