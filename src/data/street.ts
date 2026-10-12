/**
 * Street scene constants. Positions are in three.js space (Y up).
 * Blender (x, y, z) exports to three.js as (x, z, -y).
 */
export const STREET_MODEL = '/assets/models/street.glb'
export const NIGHT_SKY = '/assets/hdri/nightSky.exr'
export const DRACO = '/draco/'

/**
 * Positions exported from Blender markers (street.blend → street-markers.json),
 * already in three.js coordinates [x, y, z]. Re-export after moving things in
 * Blender; never copy coordinates by hand.
 *   LT_Route_*        walking line along the sidewalk
 *   LT_PlayerStart    where the descent lands
 *   LT_SubwayInteract "Press E" spot in front of the stairs
 *   LT_LampLight_*    bulbs of the street lamps (Blender lights don't export)
 *   LT_SubwayLight_*  lights on the subway entrance canopy
 */
import markers from './street-markers.json'

type V3 = [number, number, number]

/** Street lamp bulbs: sodium orange, isolated pools of light (the Pinterest board). */
export const LAMPS = markers.lampLights as V3[]
export const LAMP_LIGHT = {
  color: '#ff7a1f', // deep sodium orange
  glassColor: '#ffb066', // tint of the glowing lamp glass
  intensity: 24, // raise for brighter pools of light
  distance: 11, // metres the light reaches: islands with darkness between
  glassGlow: 3, // emissive strength of the lamp glass (if the lamp has a glass material)
}
export const LAMP_MATERIAL = 'Material.014'

/**
 * Per-lamp behaviour, same order as LAMPS (street-markers.json):
 *   on      steady
 *   flicker buzzes and cuts out at random
 *   dead    no light, glass dark
 */
export type LampState = 'on' | 'flicker' | 'dead'
export const LAMP_STATES: LampState[] = ['on', 'flicker', 'on', 'dead', 'on', 'on']

/**
 * Soft night fill so building silhouettes read against the sky.
 * Raise `sky` / `moon` for a brighter night, lower for darker.
 */
export const NIGHT_LIGHT = {
  skyColor: '#27302d', // dark grey with a faint green tint
  groundColor: '#070908', // almost no bounce from the street
  sky: 1.3, // keep low: darkness between lamps is the point
  moonColor: '#b4ccbf', // pale moonlight with a hint of green
  moon: 1.5,
  // behind the player's start, so it lights the faces of the buildings ahead
  moonPosition: [30, 90, 80] as [number, number, number],
}

/** Street-level fog: hazy green-grey, distant towers fade to silhouettes. */
export const FOG = { color: '#050a09', near: 10, far: 120 }

/** Mist over the sky: thick at the horizon, thinning upward. */
export const HAZE = {
  color: '#08100d', // close to the fog colour so buildings melt into it
  strength: 0.92, // 0 = clear sky, 1 = fully hazy at the horizon
  height: 0.45, // how far up the sky the haze reaches (0–1)
}

/** Sidewalk top is 0.15 m above the road; eyes ~1.6 m above that. Real scale. */
export const EYE_ABOVE_FLOOR = 1.6
export const EYE_HEIGHT = 0.15 + EYE_ABOVE_FLOOR

/** Street walking route with floor heights, [x, floorY, z] (three.js). */
export const STREET_ROUTE = markers.route as V3[]

/** Walking route as [x, z] (three.js). */
export const ROUTE = (markers.route as V3[]).map(([x, , z]) => [x, z] as [number, number])

/** Where the descent lands: the start of the route, facing along it. */
export const PLAYER_START = {
  x: ROUTE[0][0],
  z: ROUTE[0][1],
  // unit direction of the first route segment
  dirX: (ROUTE[1][0] - ROUTE[0][0]) / Math.hypot(ROUTE[1][0] - ROUTE[0][0], ROUTE[1][1] - ROUTE[0][1]),
  dirZ: (ROUTE[1][1] - ROUTE[0][1]) / Math.hypot(ROUTE[1][0] - ROUTE[0][0], ROUTE[1][1] - ROUTE[0][1]),
}

/** Lights on the subway entrance canopy: cold teal-green, the one "safe" glow at the end. */
export const SUBWAY_LIGHTS = {
  positions: markers.subwayLights as V3[],
  color: '#5fffc4',
  intensity: 8,
  distance: 9,
  /** Optional glowing materials on the entrance (none on the current model) */
  globes: {} as Record<string, { color: string; glow: number }>,
}

/** The "Press E" spot in front of the subway stairs, [x, z], and how close you must be. */
export const SUBWAY_ENTRANCE = { x: markers.subwayInteract[0], z: markers.subwayInteract[2], radius: 1.6 } // walk this close and it fades into the station

/** Fade timings (seconds) for scene changes. */
export const SCENE_FADE = { out: 1.6, in: 2.0 } // street → black → station

/** Running with Shift: faster, drains energy; energy refills when you stop running. */
export const RUN = {
  speedMultiplier: 1.7,
  drainPerSecond: 0.22, // full bar lasts ~4.5 s
  refillPerSecond: 0.12, // ~8 s to refill
  refillDelay: 0.8, // seconds after running before it refills
  minToStart: 0.25, // after emptying, need this much before you can run again
}

export const WALK = {
  speed: 3.6, // forward, metres per second (hurried walk)
  backSpeed: 2.0, // retracing steps, slower and hesitant
  maxYawDeg: 55, // how far you can look left / right
  maxPitchUpDeg: 18,
  maxPitchDownDeg: 14,
  lookSmoothing: 4, // higher = head turns faster toward the mouse
  bobAmount: 0.025, // head bob height while walking
  bobSpeed: 7,
}

/**
 * Nervous glances back while walking: at these points along the route
 * (0 = start, 1 = subway) the player looks over a shoulder and keeps walking.
 */
export const LOOK_BACK = {
  at: [0.22, 0.78], // street glances (the station has its own list)
  heavyStepsLead: 1.6, // seconds of walking before the glance when the sound starts
  /** What you hear before each street glance, in order. */
  sounds: ['steps', 'keys'] as ('steps' | 'cough' | 'laugh' | 'keys')[],
  angleDeg: 125, // how far round the head turns (varies a little each time)
  peek: 0.35, // first hesitant half-turn, as a fraction of the full turn
  peekTime: 0.45, // seconds for the hesitant half-turn
  pause: 0.18, // seconds frozen mid-turn before committing
  turn: 0.55, // seconds to finish turning round
  hold: 0.55, // seconds looking back
  back: 0.9, // seconds to turn forward again
  tiltDeg: 5, // head tilts as it turns
  dipDeg: 4, // and dips slightly
  walkSlowdown: 0.55, // walking speed multiplier while glancing
}

/** Descent cutscene timing (seconds) and the height it starts from. */
export const DESCENT = {
  phoneFade: 0.6, // phone fades to black
  skyFade: 1.2, // then the stars fade in from black
  hold: 0.3, // brief look at the stars before moving
  drop: 6, // time to reach street level
  startHeight: 75, // metres above the street: well above the tallest buildings (~23 m), lost in the high fog
  startPitchDeg: 12, // mostly sky, tower tops in frame so the drop reads
  tiltStart: 0, // camera tilts down for the whole drop
}
