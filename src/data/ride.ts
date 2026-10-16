/**
 * The ride: inside the middle carriage of the train, between stations.
 * Three.js coordinates; the train model stays put and the tunnel streams past.
 *
 * Beats, in order:
 *   depart     fade in, the train pulls away and speeds up
 *   cruise     he's in the next carriage, seen through the end-door window
 *   brake      hard stop in the tunnel; emergency lighting; the hum dies
 *   held       PA announcement; he's in your carriage now and moves only
 *              when the lights flicker, closer each time
 *   resume     the train moves again
 *   arrive     your stop is announced, chime, doors open, cut to black
 */
export const RIDE = {
  /** Walkable inside of the middle carriage (car 1). */
  area: { minX: -74.25, maxX: -72.25, minZ: 47.6, maxZ: 66.4, floorY: -9.97 },
  /** Where you are when the doors close: by the door you came in, facing across. */
  start: { x: -72.6, z: 55.5, headingDeg: -90 },

  /** Seconds to reach full speed, and seconds at full speed before he shows. */
  accelerate: 9,
  cruiseBeforeFigure: 10,
  /** He stands in the next carriage (car 0), facing you through the end door. */
  nextCarAt: { x: -73.25, z: 71.5 },
  /** If you never look his way, he's revealed (cough) after this long. */
  figureLookTimeout: 14,
  /** Seconds after you've seen him before the emergency brake. */
  brakeAfterSeen: 9,
  brakeTime: 2.4, // seconds from full speed to stopped

  /** Held in the tunnel. */
  paDelay: 2.5, // seconds after stopping before the announcement
  paShowFor: 9,
  flickerEvery: [4.5, 7] as [number, number], // seconds between light flickers (random)
  flickerDark: 0.45, // seconds the lights are out during a flicker
  /** He starts at the far end of your carriage and steps this much closer each flicker. */
  heldStartGap: 15,
  heldStep: 3,
  heldClosest: 3.4, // never closer than this on his own
  /** After he's as close as he gets, seconds before the train moves again. */
  resumeAfter: 6,

  /** Last stretch. */
  resumeRide: 12, // seconds moving before slowing for your stop
  arriveTime: 6, // seconds to slow to a stop
}

/** Sitting down (C): seats along both walls of the carriage. */
export const SEATS = {
  fromCentre: 1.05, // seat cushions run this far from the middle of the carriage (metres)
  spacing: 0.6, // one sitting spot per this much cushion
  reach: 1.1, // how close you need to be to sit
  sitInward: 0.12, // sit a little in from the wall
  eyeAboveSeat: 0.78, // eye height above the cushion
  standFromCentre: 0.3, // stand up into the aisle
  sitPrompt: 'Press C to sit',
  standPrompt: 'Press C to stand',
}

/**
 * Emergency while held in the tunnel: the carriage lights stay on but dim,
 * and a red beacon above the end door spins like a siren.
 */
export const SIREN = {
  position: [-72.8, -7.65, 57.5] as [number, number, number], // on the roof, beside the handrail, middle of your carriage
  color: '#ff1e10',
  turnsPerSecond: 0.35, // slow, heavy turn
  intensity: 22, // each of the two beams
  distance: 12,
  beamAngle: 0.6, // wide beams (radians), so they wash rather than spot
  beamSoftness: 0.95, // very soft edge: no hard circles on the walls
  beamDrop: 1.6, // beams aim a little down as they sweep (metres over 4 m)
  glow: 2.5,
  carriageLight: 0.07, // carriage lights almost out during the emergency (0–1)
  ambient: 0.2, // general fill light during the emergency (1 = normal)
  warmth: 0.1, // slight warm tint on the dimmed lights (0 = white)
}

/** How fast the tunnel streams past at full speed (metres per second), and the lamps along it. */
export const TUNNEL = {
  topSpeed: 18,
  lampSpacing: 14,
  lampLength: 120, // stretch of tunnel the lamps loop over
  lampY: -8.4,
  sides: [-76.4, -70.1] as [number, number], // x of the tunnel walls either side
  lampColor: '#ffd9a0',
  wallColor: '#020303', // black: only the passing lamps show outside
  shake: 0.006, // camera rumble at full speed
}

/** Lines and captions for the ride. */
export const RIDE_TEXT = {
  boarded: "Okay. I'm on. Just get home.",
  seenHim: 'No. He got on.',
  pa: {
    text: '"We are being held due to a passenger emergency alarm activation at the next station. We apologise for the delay."',
    sub: 'Announcement',
  },
  dontLook: "Don't look at him. Don't look at him.",
  moving: 'Move. Please move.',
  yourStop: { text: '"Now arriving at Elm Park. Doors will open on the right."', sub: 'Announcement' },
}
