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
  color: '#ff9a45', // sodium orange
  intensity: 18, // raise for brighter pools of light
  distance: 14, // metres the light reaches
  glassGlow: 3, // emissive strength of the lamp glass (if the lamp has a glass material)
}
export const LAMP_MATERIAL = 'Material.014'

/** Sidewalk top is 0.15 m above the road; eyes ~1.6 m above that. Real scale. */
export const EYE_HEIGHT = 0.15 + 1.6

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

/** The "Press E" spot in front of the subway stairs, [x, z]. */
export const SUBWAY_ENTRANCE = { x: markers.subwayInteract[0], z: markers.subwayInteract[2] }

export const WALK = {
  speed: 1.3, // forward, metres per second (slow walking pace)
  backSpeed: 0.8, // retracing steps, slower and hesitant
  maxYawDeg: 55, // how far you can look left / right
  maxPitchUpDeg: 18,
  maxPitchDownDeg: 14,
  lookSmoothing: 4, // higher = head turns faster toward the mouse
  bobAmount: 0.025, // head bob height while walking
  bobSpeed: 7,
}

/** Descent cutscene timing (seconds) and the height it starts from. */
export const DESCENT = {
  phoneFade: 0.6, // phone fades to black
  skyFade: 1.2, // then the stars fade in from black
  hold: 0.3, // brief look at the stars before moving
  drop: 5, // time to reach street level
  startHeight: 40, // metres above the street (tallest buildings ~23 m)
  startPitchDeg: 12, // mostly sky, tower tops in frame so the drop reads
  tiltStart: 0, // camera tilts down for the whole drop
}
