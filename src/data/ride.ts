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
  heldClosest: 2.2,
  /** Walk at him and he vanishes to the far end of the carriage this close (metres). */
  vanishDistance: 1.9,
  /** After he's as close as he gets, seconds before the train moves again. */
  resumeAfter: 6,

  /** Last stretch. */
  resumeRide: 12, // seconds moving before slowing for your stop
  arriveTime: 6, // seconds to slow to a stop
}

/**
 * Emergency while held in the tunnel: the carriage lights stay on but dim,
 * and a red beacon on the ceiling spins like a siren.
 */
export const SIREN = {
  position: [-73.25, -7.72, 57] as [number, number, number], // on the ceiling (-7.65), middle of your carriage
  color: '#ff2414',
  turnsPerSecond: 0.9,
  sweep: 0.9, // how far the spinning beam swings out (metres)
  intensity: 9,
  distance: 8,
  glow: 2.5,
  carriageLight: 0.3, // carriage lights dim to this (0–1)
  warmth: 0.15, // slight warm tint on the dimmed lights (0 = white)
}

/** How fast the tunnel streams past at full speed (metres per second), and the lamps along it. */
export const TUNNEL = {
  topSpeed: 18,
  lampSpacing: 14,
  lampLength: 120, // stretch of tunnel the lamps loop over
  lampY: -8.4,
  sides: [-76.4, -70.1] as [number, number], // x of the tunnel walls either side
  lampColor: '#ffd9a0',
  wallColor: '#0b0d0c',
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
