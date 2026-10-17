/**
 * The shared "stand together" count at the end of the resources screen. Kept on
 * Abacus (abacus.jasoncameron.dev): a free counting API, no account, no personal
 * data sent, just +1. A counter lives 6 months from the last time anyone reads it.
 * The dev server counts separately, so testing never adds to the real number.
 */
const KEY = import.meta.env.DEV ? 'stand-together-dev' : 'stand-together-live'
const COUNTER = `https://abacus.jasoncameron.dev/%s/last-train-jaismin-ks/${KEY}`
/** This browser pressed it: 'counted', or 'pending' if the +1 hasn't got through yet (one person counts once). */
export const PRESSED = 'last-train:support-pressed'
const TRIES = 3 // the service has the odd hiccup: try again a moment later
const GET_TIMEOUT = 8000 // a slow read is abandoned and tried again (never a +1: that could count someone twice)

async function call(action: 'get' | 'hit'): Promise<number | null> {
  for (let i = 0; i < TRIES; i++) {
    try {
      const res = await fetch(COUNTER.replace('%s', action), action === 'get' ? { signal: AbortSignal.timeout(GET_TIMEOUT) } : undefined)
      if (res.ok) {
        const { value } = (await res.json()) as { value?: number }
        if (typeof value === 'number') return value
      } else if (action === 'get' && res.status === 404) return 0 // nobody yet
    } catch {
      // offline or the service is down: try again, then give up quietly
    }
    if (i < TRIES - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
  }
  return null // the button still works, just without a number
}

/** How many people have pressed it (null if it can't be reached). */
export const supportCount = () => call('get')

/** Count this person (once): the new total, or null if it couldn't get through (it's sent again next visit). */
let sending: Promise<number | null> | null = null // never two +1s at once (e.g. React mounting twice in dev)
export function addSupport() {
  sending ??= (async () => {
    remember('pending')
    const n = await call('hit')
    if (n !== null) remember('counted')
    sending = null
    return n
  })()
  return sending
}

/** Pressed before, in this browser? */
export const hasPressed = () => read() !== null
/** Pressed, but the +1 never got through: send it now. */
export const isPending = () => read() === 'pending'

function read() {
  try {
    return localStorage.getItem(PRESSED)
  } catch {
    return null
  }
}
function remember(state: 'pending' | 'counted') {
  try {
    localStorage.setItem(PRESSED, state)
  } catch {
    // private window: fine, it just won't remember
  }
}
