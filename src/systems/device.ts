import { useEffect, useState } from 'react'

/** A phone or tablet: touch, no mouse to hover with. */
export const isTouch = typeof matchMedia !== 'undefined' && matchMedia('(hover: none) and (pointer: coarse)').matches

/** iPhone / iPad (iPadOS reports itself as a Mac, but with touch). */
export const isIOS =
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

/** Opened from the Home Screen (no browser bars at all). */
export const isStandalone =
  typeof matchMedia !== 'undefined' &&
  (matchMedia('(display-mode: fullscreen)').matches ||
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true)

/** Portrait right now (changes as the phone turns). */
export const portraitQuery = typeof matchMedia !== 'undefined' ? matchMedia('(orientation: portrait)') : null

type FullscreenEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
const fullscreenNow = () =>
  !!(document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement)

/** A phone rather than a tablet (by its short side). */
const isPhone = isTouch && typeof screen !== 'undefined' && Math.min(screen.width, screen.height) < 600

/**
 * Fullscreen where the browser allows it (Android Chrome does; iPhone Safari never
 * lets a page go fullscreen, so iPhones use Add to Home Screen for that).
 * Phones stay upright. Only works inside a tap, so it's called from taps.
 */
export function goFullscreen() {
  if (!isTouch || isStandalone || fullscreenNow()) return
  const el = document.documentElement as FullscreenEl
  const full = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el)
  if (!full) return
  Promise.resolve(full())
    .then(() => {
      if (isPhone) return (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('portrait')
    })
    .catch(() => {}) // refused: it still plays in the browser
}

// Leaving fullscreen (back gesture) isn't a tap, so it can't come back then:
// the next tap anywhere takes it fullscreen again.
if (isTouch && typeof window !== 'undefined') window.addEventListener('pointerup', goFullscreen, true)

/** Whether the screen is taller than it is wide right now (follows the phone turning). */
export function usePortrait() {
  const [portrait, setPortrait] = useState(() => !!portraitQuery?.matches)
  useEffect(() => {
    const q = portraitQuery
    if (!q) return
    const on = () => setPortrait(q.matches)
    q.addEventListener('change', on)
    return () => q.removeEventListener('change', on)
  }, [])
  return portrait
}

/**
 * The 3D view's field of view for this screen shape. Scenes are framed for a wide
 * screen; on a tall one (a phone held upright) the same angle would show a thin
 * slice, so the view opens up (most of the way, not so far it bends at the edges).
 */
export const FIT = { widen: 0.4, max: 95 }
export function fitFov(fov: number, aspect: number) {
  if (!(aspect > 0) || aspect >= 1) return fov
  return Math.min(FIT.max, fov * (1 + (1 / aspect - 1) * FIT.widen))
}
