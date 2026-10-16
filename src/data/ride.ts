/**
 * The ride: inside the middle carriage of the train. Three stretches of tunnel
 * and three stations. Three.js coordinates; the train stays put and the
 * tunnel (and each station) streams past.
 *
 * Each stretch has one ritual (random order each playthrough: text a friend,
 * fake a call, keys between your fingers). Each station the doors open and
 * you choose: get off (he follows — its own ending) or stay on.
 *   stretch 1  he's in the next carriage, seen through the end-door window
 *   station 1  doors open; stay, and he's in your carriage when they close
 *   stretch 2  emergency stop in the tunnel; he comes closer on each flicker
 *   station 2  doors open again
 *   stretch 3  he's close; the lights keep failing
 *   station 3  your stop: you step off without looking back (ambiguous ending)
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
  /** Seconds after the ritual (or after it's offered and ignored) before the next thing happens. */
  afterRitual: 6,
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
  /** Once he's in your carriage he paces it end to end, slowly. */
  pace: { speed: 0.7, restAtEnd: 2.5, stareFor: 3.5, aisleHalfWidth: 0.6 },
  /** After he's as close as he gets, seconds before the train moves again. */
  resumeAfter: 6,

  /** Pulling into a station / leaving it. */
  arriveTime: 6, // seconds to slow to a stop
  resumeRide: 8, // seconds moving after the emergency stop before the next station
  /** Station 2 onward: where he is when the doors close (metres from you, in your carriage). */
  afterStation1Gap: 13,
  afterStation2Gap: 8,
  /** Stretch 3: the lights fail every so often and he's a little closer each time. */
  stretch3Flicker: [6, 9] as [number, number],
  stretch3Step: 1.5,
}

/** Sitting down (C): seats along both walls of the carriage. */
export const SEATS = {
  fromCentre: 1.05, // seat cushions run this far from the middle of the carriage (metres)
  spacing: 0.6, // one sitting spot per this much cushion
  reach: 1.1, // how close you need to be to sit
  sitInward: 0.12, // sit a little in from the wall
  eyeAboveSeat: 0.78, // eye height above the cushion
  standFromCentre: 0.3, // stand up into the aisle
  sitPrompt: 'C|sit',
  standPrompt: 'C|stand',
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
  boarded: 'Okay. I’m on.',
  seenHim: 'He got on.',
  pa: {
    text: '"We are being held due to a passenger emergency alarm activation at the next station. We apologise for the delay."',
    sub: 'Announcement',
  },
  dontLook: 'Don’t look at him.',
  moving: 'Please move.',
  arriving: (name: string, last: boolean) => ({
    text: last ? `"Now arriving at ${name}. This is your stop."` : `"Now arriving at ${name}. Doors will open on the right."`,
    sub: 'Announcement',
  }),
  choice: { text: 'Get off here, or stay on', sub: 'Walk through the doors to get off' },
  choiceThoughts: ['If I get off, he gets off.', 'Two more stops.'],
  stayed: ['He’s in my carriage.', 'One more stop.'],
  lastStop: { text: 'Get off', sub: 'Walk through the doors' },
  doorsLabel: 'Doors close in',
}

/** The three stations: names on their signs, and how long the doors stay open for you to decide. */
export const STATIONS = {
  names: ['KINGSWAY', 'ASHDALE', 'ELM PARK'],
  doorsOpenFor: 9, // seconds to decide (stations 1 and 2)
  /** Getting off: walk up to an open door (this close to its middle, along the carriage, and this far over toward it)... */
  doorReach: 0.75,
  doorSideX: -72.7,
  /** ...and you're carried out to here on the platform (x). */
  stepOutX: -69.6,
  /** While the doors are open you can walk this far into a doorway (x). */
  doorwayX: -71.95,
  /** Station model placement (three.js) and the extras we add to it. */
  model: {
    edgeX: -71.75, // its platform edge, just past the train doors (-71.86)
    floorY: -9.97, // level with the carriage floor
    lights: [-21, -7, 7, 21], // tube lights under the ceiling (z)
    lightX: 2.0,
    lightY: 2.55,
    lightIntensity: 9,
  },
  colors: { light: '#e8fff4' },
}

/** Rituals on the train (one per stretch, random order). Press E when offered. */
export const RIDE_RITUALS = {
  offerAfter: 5, // seconds into a stretch (once he's around) before the ritual is offered
  ignoreAfter: 16, // offered but not done: the moment passes
  batteryAtStart: 3, // phone battery (%) on the train; each phone ritual uses 1%, down to 1%
  text: {
    nudge: 'I should tell someone where I am.',
    prompt: 'E|text Jess',
    /** Already in the chat: Jess (Maya's best friend) asked her to check in. */
    earlier: { time: 'Today 11:41 PM', text: 'text me when ur on the train!! 🫶' },
    message: 'on the last train, 2nd car. text me back pls',
    perLetter: 0.07,
    hold: 2.5, // after "Not Delivered"
    thought: 'No signal.',
    deliveredThought: 'It sent.',
  },
  call: {
    nudge: 'If he thinks someone’s waiting for me…',
    prompt: 'E|fake a call',
    lines: ['Hi! Yeah, I’m on the train.', 'No, I’m almost there. You can see me from the window, right?', 'Okay. Stay on the line.'],
    perLine: 2.8,
    thought: '', // the call screen says it: Call Failed
  },
  keys: {
    nudge: 'Keys.',
    prompt: 'E|keys between your fingers',
    thought: 'Like Mom taught me.',
  },
}
