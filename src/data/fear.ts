/**
 * Fear: a hidden 0–1 level (store.stress). It rises the closer he is and while
 * you look at him; it drains with distance, in the bright light and under the
 * camera (while it still works). As it rises: heartbeat louder and faster,
 * screen edges darken, your view narrows, sound muffles, you walk slower.
 * At the top you freeze in panic for a moment, and he comes closer.
 */
export const FEAR = {
  range: 14, // he starts to frighten you within this distance (metres)
  rise: 0.3, // per second when he's right next to you (scales down with distance)
  lookRise: 0.06, // extra per second while he's on screen within range
  fall: 0.07, // per second when he's out of range
  calmFall: 0.35, // per second in the bright light / under the working camera
  heartbeatAt: 0.25, // heartbeat starts above this
  panicTime: 2.2, // seconds frozen when it peaks
  panicCrawl: 0.12, // you can still barely move (fraction of walking speed), so it reads as fear, not a bug
  panicTremble: 0.02, // camera shake while frozen (metres)
  panicStare: 3.5, // how hard your gaze is dragged to him while frozen (higher = faster)
  afterPanic: 0.7, // fear level once the panic passes
  panicStep: 2.5, // he comes this much closer while you're frozen (metres)
  panicCooldown: 6, // seconds after a freeze before getting close can freeze you again
  /**
   * Three strikes: get within `panicDistance` of him and you freeze. The first
   * two times he walks a little closer and stops, and you can move again.
   * The third time he walks all the way to you, and it's over.
   */
  panicDistance: 4,
  strikes: 3,
  lastLines: ["Move. Move. Why can't I move?", 'Not again. Please.', 'No—'],

  // Effects at full fear
  fovDrop: 16, // degrees narrower view
  slowDown: 0.45, // walking speed lost
  muffle: 0.85, // how muffled everything sounds (0 = not at all)
  vignette: 0.9, // how dark the screen edges get
}

/**
 * Walking at him: he doesn't back off, he comes to you. Every `approachStep`
 * metres you close, he walks `stepToward` metres toward you, and fear jumps.
 * If he reaches you (`contact`), it's over: cut to black.
 */
export const APPROACH = {
  range: 10,
  approachStep: 1.0,
  stepToward: 1.4,
  fearJump: 0.12,
  contact: 1.5, // only YOU walking into him gets this close
  /** His own steps toward you (approach or panic) always stop this far away. */
  holdOff: 2.2,
}

/** How he walks (metres per second). */
export const FIGURE_WALK = {
  creep: 0.9, // slow, deliberate, while you're not looking
  toward: 1.5, // coming at you
}

/** The screen when he reaches you. He never speaks. */
export const CAUGHT = {
  heading: 'You know how this ends.',
  line: 'So does she.',
}
