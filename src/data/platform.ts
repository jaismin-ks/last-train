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
  /**
   * Where he can be waiting, eyes shut, before you find him: dark spots along
   * the platform. While you explore he moves (unseen) to a spot ahead of
   * wherever you're heading, so the first time you see him is where you are.
   */
  lurkSpots: [
    { x: -66.75, z: 36 }, // under the dead light by the gate end
    { x: -69.5, z: 41 }, // near the platform edge, same dark stretch
    { x: -66.9, z: 52 }, // by the wall past the benches
    { x: -66.75, z: 72 }, // under the second dead light
    { x: -69.4, z: 76 }, // edge, far dark stretch
    { x: -67.3, z: 84.5 }, // far end corner
  ],
  /** He waits this far from you (metres), and re-picks his spot this often (seconds). */
  lurkRange: { min: 9, max: 22, ideal: 14 },
  lurkRepick: 1.2,
  /** Get this close to him (unseen) and you hear his keys, like on the street. */
  keysDistance: 18,
  /**
   * How he arrives: this long after you reach the platform, a light flickers
   * at one of these tubes (both dark stretches and both far ends, well away from
   * the camera and the brightest light) and he's standing under it. Your view
   * turns to him wherever you are. Picks one at least `spawnMinDistance` from you.
   */
  appearAfter: [6, 12] as [number, number], // seconds (random each time), so where you are when he comes varies
  spawnTubes: [0, 1, 5, 6],
  /**
   * One ritual, on the far side from him: he appears at the camera end (before
   * this z) → the light; at the light end → the camera (and then the light dies anyway).
   */
  ritualSplitZ: 55,
  spawnDistance: [10, 60], // picks at random among the spots this far from you
  /** How long your view is held on him once he's there (seconds). */
  appearFocus: 2.2,
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
  ritualDelay: 4,
  /** ...or this long after he appears, even if you never looked his way. */
  ritualLatest: 9,

  /**
   * CCTV ritual: stand where the camera can see you (in front of it, within
   * `cameraRadius` metres and `cameraViewDeg` of where it points) while facing
   * it (left/right within `cameraLookDeg`; up/down doesn't matter) for `cameraHold` seconds.
   */
  cameraRadius: 9,
  cameraViewDeg: 55,
  cameraLookDeg: 30,
  cameraHold: 1.2,
  /** After the camera's light dies, seconds before the next ritual. */
  cameraAfter: 6,

  /** The brightest tube (index), where the ritual happens. */
  brightTube: 4,
  /** How close (metres) to stand under it, and for how long (seconds). */
  brightReach: 2.6, // anywhere in its pool of light: this far along the platform from the tube, any spot across
  brightHold: 3.5,
  /** After the calm, seconds until the bright light starts dying. */
  calmTime: 6,
  /** The dying light: seconds of buzzing flicker, then seconds of full dark. */
  dyingTime: 2.6,
  darkTime: 2.2,
  /** For this long at the start of the dark, every platform light is out (he moves then). */
  allDarkTime: 0.9,
  /** In the dark he closes in to this distance from you (metres). */
  darkApproach: 6, // he walks there, straight through where the light was

  // The train is heard (faintly, far down the tunnel) as soon as the light dies;
  // it comes into view so that it stops exactly when the arrival sound does.
}

/**
 * How he moves on the platform once he's shown himself: he walks (see
 * `patrol`), keeping clear of the camera and the bright light while you need
 * them, and never in the way of where you're going.
 */
export const FIGURE = {
  /** While you need the camera he keeps this far (metres) from it. */
  cameraKeepOut: 6,
  /**
   * Once he's shown himself he walks the platform: to a spot this far from
   * you [min, max] (closer as the night goes on), pausing a few seconds between.
   */
  patrol: {
    presence: [10, 15],
    camera: [9, 14],
    cameraAfter: [9, 13],
    light: [8, 13],
    waitTrain: [6, 9],
    train: [6, 9],
    board: [6, 10],
  } as Record<string, [number, number]>,
  patrolRest: [3, 7] as [number, number],
  /** While the bright light works he never comes within this distance (metres) of it. */
  brightKeepOut: 6.5,
  lane: -67.8, // his line along the platform (x), off-centre toward the wall but clear of the vending machine
  maxSeenDistance: 45, // further than this (lost in the fog) doesn't count as seeing him
  /** His footsteps while he walks: full volume this close (metres), silent this far. */
  steps: { volume: 0.22, near: 6, far: 26 },
}

/** Train arrival: slides in from the far end, slowing to a stop. */
export const TRAIN_ARRIVAL = {
  distance: 150, // metres down the tunnel it starts from
  time: 12, // seconds from coming into view to stopping (the loud end of the arrival sound)
  /** Start the arrival sound this far in (seconds): a shorter faint stretch, so the train comes sooner after the dark. */
  soundFrom: 10,
  doorsAfter: 1.4, // seconds after stopping before the doors open
  headlight: {
    color: '#f4fff8',
    intensity: 90, // beam down the tunnel ahead of the train
    distance: 70,
    spill: 25, // light on the walls right around the front of the train
    height: 0.75, // above the carriage floor
    spread: 0.7, // headlamps either side of the middle (metres)
    glare: 0.9, // size of each headlamp's glare
  },
}

/** Walking into an open door: how close (metres, along the platform) to a door's middle. */
export const BOARDING = { doorHalfWidth: 0.85, edgeX: -69.9, fade: 1.4 }

/** Lines and captions for the platform. */
/**
 * What she thinks, and the few plain objectives. Her thoughts carry the story;
 * they never explain it. Objectives stay short.
 */
export const PLATFORM_TEXT = {
  firstSeen: 'Was he there before?',
  firstSeenKeys: 'Those keys.', // you heard his keys on the street, and again just now
  panic: 'My legs won’t move.',
  cameraNudge: 'If something happens, at least it’ll be on camera.',
  camera: { text: 'Stand where the camera can see you' },
  cameraDead: 'The light’s off.',
  lightNudge: 'Stay in the light.',
  ritual: { text: 'Stay where it’s brightest' },
  calm: 'Anyone would see me here.',
  dark: 'No. No, no.',
  trainHeard: 'Finally.',
  board: { text: 'Get on the train' },
}

/** The CCTV camera on the back wall (three.js coords), aimed back toward the gate. */
export const CCTV = {
  position: [-66.25, -7.3, 47] as [number, number, number], // where its wall plate sits
  yawDeg: -35, // 0 = pointing straight across at the tracks; negative turns it toward the gate end
  scale: 1.5, // model is ~50 cm long; bigger so it reads from the platform
  ledColor: '#ff2a1a',
  glowSize: 0.45, // metres across the red glow around the light
  glowStrength: 0.95,
  lightIntensity: 2.5, // red light it casts on the wall around it
  blinkEvery: 1.6, // seconds per blink while it "works"
}
