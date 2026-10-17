/** A phone or tablet: touch, no mouse to hover with. */
export const isTouch = typeof matchMedia !== 'undefined' && matchMedia('(hover: none) and (pointer: coarse)').matches

/** Portrait right now (changes as the phone turns). */
export const portraitQuery = typeof matchMedia !== 'undefined' ? matchMedia('(orientation: portrait)') : null

/**
 * On Begin (a tap): go fullscreen and hold landscape where the browser allows it
 * (Android Chrome does; iPhones don't, so they get the turn-your-phone screen).
 */
export function goLandscape() {
  if (!isTouch) return
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
  const full = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el)
  Promise.resolve(full?.())
    .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
    .catch(() => {}) // not allowed here: the turn-your-phone screen covers it
}
