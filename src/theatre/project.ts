import { getProject } from '@theatre/core'

/**
 * Theatre.js project. Animate in the studio UI (dev only), then
 * "Export" the state and save it as src/theatre/state.json, and pass it here:
 *   import state from './state.json'
 *   getProject('Last Train', { state })
 */
export const project = getProject('Last Train')

export const sheets = {
  phoneIntro: project.sheet('Phone Intro'),
}

// Theatre ships CommonJS; depending on the bundler the export may sit on `.default`.
const unwrap = <T,>(mod: T): T => (mod as { default?: T }).default ?? mod

/** Loads the studio UI in dev only, so it never ships in the production build. */
export async function setupTheatre() {
  if (!import.meta.env.DEV) return
  const studio = unwrap((await import('@theatre/studio')).default)
  const extension = unwrap((await import('@theatre/r3f/dist/extension')).default)
  studio.initialize()
  studio.extend(extension)
  // Hidden by default so the game looks like the real thing; press ` to toggle
  studio.ui.hide()
  window.addEventListener('keydown', (e) => {
    if (e.key !== '`') return
    if (studio.ui.isHidden) studio.ui.restore()
    else studio.ui.hide()
  })
}
