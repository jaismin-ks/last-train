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

/**
 * Fullscreen, held sideways, where the browser allows it (Android Chrome does; iPhone
 * Safari never lets a page go fullscreen, so iPhones use Add to Home Screen instead).
 * Only works inside a tap, so it's called from taps.
 */
export function goLandscape() {
  if (!isTouch || isStandalone || fullscreenNow()) return
  const el = document.documentElement as FullscreenEl
  const full = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el)
  if (!full) return
  Promise.resolve(full())
    .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
    .catch(() => {}) // refused: the turn-your-phone screen still covers it
}

// Turning the phone isn't a tap, so fullscreen can't start then: the next tap
// in landscape (anywhere) takes it fullscreen instead.
if (isTouch && typeof window !== 'undefined') {
  window.addEventListener(
    'pointerup',
    () => {
      if (!portraitQuery?.matches) goLandscape()
    },
    true,
  )
}
