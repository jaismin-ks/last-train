/**
 * The platform story: waiting for the last train. Positions are three.js
 * coordinates; the platform runs along z (24 at the gate end → 90 at the far end),
 * x from -70.3 (track edge) to -66.5 (back wall). Floor at y -10.02.
 *
 * Beats, in order:
 *   lurk      he's already there, eyes shut, in the darkest stretch by the wall;
 *             you explore. Get close enough and look, and his eyes open. If you
 *             never find him, after a while a light flickers and he's under it
 *   presence  he's seen; from now on he moves only when you're not looking
 *   camera    "stand where the camera can see you" — its red light dies
 *   light     "stand under the brightest light" — staying there calms you
 *   lightDies the bright light buzzes and dies; in the dark he gets closer
 *   train     the train pulls in, doors open
 *   board     walk into a door → fade to black → the ride
 */
export const PLATFORM_STORY = {
  /** Where he waits at first: against the back wall, under the dead light. */
  lurkAt: { x: -66.75, z: 72 },
  /** He reveals himself when he's on screen and you're this close (metres)... */
  revealDistance: 15,
  /** ...or after this many seconds, under a light you're looking at. */
  lurkTime: 40,

  /**
   * He appears under a working light you're looking at, this far away
   * (metres; picks the one nearest `ideal`). If you're facing away from every
   * light, he takes the one nearest `ideal` and you hear him cough.
   */
  appearDistance: { min: 12, max: 34, ideal: 22 },
  /** He stands this far past the light (metres), so it's behind him. */
  appearBehindLight: 1.8,
  /** How long that tube is dark while he appears (seconds). */
  appearDarkTime: 1.6,

  /** Seconds after you first see him before the first ritual prompt. */
  ritualDelay: 6,
  /** ...or this long after he appears, even if you never looked his way. */
  ritualLatest: 16,

  /** CCTV ritual: stand within this distance (metres) and look at the camera for `cameraHold` seconds. */
  cameraRadius: 4.5,
  cameraLookDeg: 18, // how close to the middle of the screen it must be
  cameraHold: 1.5,
  /** After the camera's light dies, seconds before the next ritual. */
  cameraAfter: 6,

  /** The brightest tube (index), where the ritual happens. */
  brightTube: 4,
  /** How close (metres) to stand under it, and for how long (seconds). */
  brightRadius: 1.7,
  brightHold: 3.5,
  /** After the calm, seconds until the bright light starts dying. */
  calmTime: 6,
  /** The dying light: seconds of buzzing flicker, then seconds of full dark. */
  dyingTime: 2.6,
  darkTime: 2.2,
  /** For this long at the start of the dark, every platform light is out (he moves then). */
  allDarkTime: 0.9,
  /** In the dark he closes in to this distance from you (metres). */
  darkApproach: 7,

  /** Seconds after the light dies before the train starts arriving. */
  trainDelay: 5,
}

/**
 * How he moves: only while you're not looking (he's off screen), and only
 * after he's been unseen for `unseenTime`. Each move brings him `step` metres
 * closer, never nearer than `minDistance`.
 */
export const FIGURE = {
  unseenTime: 2.4,
  step: 6,
  minDistance: 6,
  lane: -67.8, // his line along the platform (x), off-centre toward the wall but clear of the vending machine
  maxSeenDistance: 45, // further than this (lost in the fog) doesn't count as seeing him
}

/** Heartbeat comes in when he's this close or closer (metres), unless you're calm in the light. */
export const FEAR_DISTANCE = 16

/** Train arrival: slides in from the far end, slowing to a stop. */
export const TRAIN_ARRIVAL = {
  distance: 150, // metres down the tunnel it starts from
  time: 10, // seconds to come to a stop
  doorsAfter: 1.4, // seconds after stopping before the doors open
  headlight: { color: '#f4fff8', intensity: 40, distance: 30 },
}

/** Walking into an open door: how close (metres, along the platform) to a door's middle. */
export const BOARDING = { doorHalfWidth: 0.85, edgeX: -69.9, fade: 1.4 }

/** Lines and captions for the platform. */
export const PLATFORM_TEXT = {
  firstSeen: 'Was he there before?',
  camera: { text: 'Stand where the camera can see you' },
  cameraDead: "Its light's off. It's not even recording.",
  ritual: { text: 'Stand under the brightest light' },
  calm: 'Okay. Anyone can see me here.',
  dark: 'No. No, no, no.',
  trainHeard: 'Finally.',
  board: { text: 'Get on the train' },
}

/** The CCTV camera on the back wall (three.js coords), aimed back toward the gate. */
export const CCTV = {
  position: [-66.25, -7.3, 47] as [number, number, number], // where its wall plate sits
  yawDeg: -35, // 0 = pointing straight across at the tracks; negative turns it toward the gate end
  scale: 1.5, // model is ~50 cm long; bigger so it reads from the platform
  ledColor: '#ff2a1a',
  blinkEvery: 1.6, // seconds per blink while it "works"
}
