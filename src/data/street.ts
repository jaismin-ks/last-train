/**
 * Street scene constants. Positions are in three.js space (Y up).
 * Blender (x, y, z) exports to three.js as (x, z, -y).
 */
export const STREET_MODEL = '/assets/models/street.glb'
export const NIGHT_SKY = '/assets/hdri/nightSky.exr'
export const DRACO = '/draco/'

/**
 * Street lamp heads (the glowing glass, material "Material.014"),
 * converted from Blender (x, y, z) to three.js (x, z, -y).
 */
const LAMPS_BLENDER: [number, number, number][] = [
  [-1.16, -4.21, 1.03],
  [-0.93, 2.72, 1.03],
  [0.66, 4.52, 1.03],
  [3.41, 6.28, 1.03],
  [-4.6, -4.58, 1.03],
  [-4.32, 3.03, 1.03],
  [-1.5, 7.03, 1.03],
  [-3.32, 5.24, 1.03],
  [1.72, 8.95, 1.03],
]
export const LAMPS = LAMPS_BLENDER.map(([x, y, z]) => [x, z, -y] as [number, number, number])

export const LAMP_LIGHT = {
  color: '#c9d8ff', // cold blue-white, uneasy rather than cosy
  intensity: 2.5, // raise for brighter pools of light
  distance: 5, // units the light reaches (the model is ~1/3 real scale)
  glassGlow: 3, // emissive strength of the lamp glass
}
export const LAMP_MATERIAL = 'Material.014'

/**
 * Player eye height in model units. The street model is about one-third real
 * scale (subway railings 0.34, sign poles 0.68, lamp posts ~1), so a person's
 * eyes (~1.6 m) sit at ~0.5.
 */
export const EYE_HEIGHT = 0.5

/**
 * The walking route: from the far (top-right) end of the street, down the
 * left-hand sidewalk, round the corner, to the subway entrance.
 * Blender (x, y) ground coords, checked in Blender with raycasts: always over
 * sidewalk, at least ~0.3 units (about 1 m at real scale) from any wall.
 */
const ROUTE_BLENDER: [number, number][] = [
  [2.3, 10.2],
  [1.4, 9.5],
  [-1.8, 7.6],
  [-3.95, 5.75],
  [-5.0, 3.0],
  [-5.3, -1],
  [-5.25, -5],
  [-5.35, -8.6], // in front of the subway stairs (opening faces up the street)
]
export const ROUTE = ROUTE_BLENDER.map(([x, y]) => [x, -y] as [number, number]) // [x, z] in three.js

/** Where the descent lands: the start of the route, facing along it. */
export const PLAYER_START = {
  x: ROUTE[0][0],
  z: ROUTE[0][1],
  // unit direction of the first route segment
  dirX: (ROUTE[1][0] - ROUTE[0][0]) / Math.hypot(ROUTE[1][0] - ROUTE[0][0], ROUTE[1][1] - ROUTE[0][1]),
  dirZ: (ROUTE[1][1] - ROUTE[0][1]) / Math.hypot(ROUTE[1][0] - ROUTE[0][0], ROUTE[1][1] - ROUTE[0][1]),
}

/**
 * Subway entrance globe lamps. In Blender these are point lights ("Point",
 * "Point.001"), which the glTF export leaves out, so they are recreated here.
 */
export const SUBWAY_LIGHTS = {
  positions: (
    [
      [-5.62, -10.13, 0.71],
      [-5.62, -9.36, 0.71],
    ] as [number, number, number][]
  ).map(([x, y, z]) => [x, z, -y] as [number, number, number]),
  color: '#bfe8cf', // pale cold green-white, fits the cold street (Blender had warm #ffc33f)
  intensity: 0.9,
  distance: 2.4,
  /** Globe materials and how they glow (both halves, so it reads lit from any angle) */
  globes: { topgreen: { color: '#7dffb0', glow: 2 }, bottomwhite: { color: '#d8ffe6', glow: 1.6 } } as Record<
    string,
    { color: string; glow: number }
  >,
}

/** The subway entrance (stairs centre) in three.js coords — for "press E" later. */
export const SUBWAY_ENTRANCE = { x: -5.35, z: 9.75 }

export const WALK = {
  speed: 0.6, // forward, units per second (model is ~1/3 scale, ≈ walking pace)
  backSpeed: 0.35, // retracing steps, slower and hesitant
  maxYawDeg: 55, // how far you can look left / right
  maxPitchUpDeg: 18,
  maxPitchDownDeg: 14,
  lookSmoothing: 4, // higher = head turns faster toward the mouse
  bobAmount: 0.008, // head bob height while walking
  bobSpeed: 7,
}

/** Descent cutscene timing (seconds) and the height it starts from. */
export const DESCENT = {
  phoneFade: 0.6, // phone fades to black
  skyFade: 1.2, // then the stars fade in from black
  hold: 0.3, // brief look at the stars before moving
  drop: 5, // time to reach street level
  startHeight: 24, // metres above the street (towers are ~12 m)
  startPitchDeg: 12, // mostly sky, tower tops in frame so the drop reads
  tiltStart: 0, // camera tilts down for the whole drop
}
