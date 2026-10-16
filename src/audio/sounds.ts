import { Howl, Howler } from 'howler'

// Dev only: lets tests inspect what is playing
if (import.meta.env.DEV) (window as unknown as { Howler: typeof Howler }).Howler = Howler

/**
 * Sound effects, cut and compressed from assets-src/audio-raw/ into
 * public/assets/audio/sfx/ (ffmpeg). Volumes are relative (0–1).
 */
const sfx = (name: string, volume: number, extra: Partial<ConstructorParameters<typeof Howl>[0]> = {}) =>
  new Howl({ src: [`/assets/audio/sfx/${name}.mp3`], volume, preload: true, ...extra })

// Single clicks, cut tight and kept as WAV (no MP3 padding) so they land exactly on each letter
const keyTaps = [1, 2, 3, 4].map((n) => new Howl({ src: [`/assets/audio/sfx/key-tap-${n}.wav`], volume: 0.5, preload: true }))
const messageOut = sfx('message-out', 0.7)
const messageIn = sfx('message-in', 0.75)
const lowBattery = sfx('low-battery', 0.8)
const footsteps = sfx('footsteps-concrete', 0.55, { loop: true })

/** One keyboard tap per typed letter, varied so it doesn't sound mechanical. */
export function playKeyTap() {
  keyTaps[Math.floor(Math.random() * keyTaps.length)].play()
}

export const playMessageOut = () => messageOut.play()
export const playMessageIn = () => messageIn.play()
export const playLowBattery = () => lowBattery.play()

let stepsId: number | null = null
/**
 * Footsteps loop while walking. `speed` 1 = normal walk; lower for the
 * slower backwards steps. Pass 0 to stop (short fade so it doesn't click).
 */
export function setFootsteps(speed: number) {
  if (speed > 0) {
    if (stepsId === null || !footsteps.playing(stepsId)) {
      stepsId = footsteps.play()
      footsteps.fade(0, 0.55, 120, stepsId)
    }
    footsteps.rate(speed, stepsId)
  } else if (stepsId !== null && footsteps.playing(stepsId)) {
    const id = stepsId
    footsteps.fade(footsteps.volume(id) as number, 0, 150, id)
    footsteps.once('fade', () => footsteps.pause(id), id)
    stepsId = null
  }
}

/** Outside night ambience: a quiet bed under the street, looping seamlessly. */
const AMBIENCE_VOLUME = 0.18
const ambience = new Howl({ src: ['/assets/audio/ambience/outside.mp3'], volume: 0, loop: true, preload: true })
let ambienceOn = false

/** Fades the ambience in (call once the phone has faded out). Safe to call twice. */
export function startAmbience(fadeMs = 3000) {
  if (ambienceOn) return
  ambienceOn = true
  const id = ambience.play()
  ambience.fade(0, AMBIENCE_VOLUME, fadeMs, id)
}

/** Fades out and stops every playing copy of the ambience (e.g. going into the subway). */
export function stopAmbience(fadeMs = 1400) {
  ambienceOn = false
  if (!ambience.playing()) return
  ambience.fade(ambience.volume() as number, 0, fadeMs) // no id: applies to all copies
  ambience.once('fade', () => {
    if (!ambienceOn) ambience.stop()
  })
}

/** Escalator motor hum: one loop whose volume follows distance to the nearest running escalator. */
const escalator = new Howl({ src: ['/assets/audio/sfx/escalator-loop.mp3'], volume: 0, loop: true, preload: true })
let escalatorOn = false
export function setEscalatorVolume(volume: number) {
  if (volume > 0.001 && !escalatorOn) {
    escalatorOn = true
    escalator.play()
  }
  if (escalatorOn) escalator.volume(volume)
}
export function stopEscalator() {
  escalatorOn = false
  escalator.stop()
}

/** Station ambience: low background bed while you're underground. */
const STATION_AMBIENCE_VOLUME = 0.14
const stationAmbience = new Howl({ src: ['/assets/audio/ambience/station.mp3'], volume: 0, loop: true, preload: true })
let stationOn = false
export function startStationAmbience(fadeMs = 2500) {
  if (stationOn) return
  stationOn = true
  stationAmbience.play()
  stationAmbience.fade(0, STATION_AMBIENCE_VOLUME, fadeMs)
}
export function stopStationAmbience(fadeMs = 1000) {
  stationOn = false
  if (!stationAmbience.playing()) return
  stationAmbience.fade(stationAmbience.volume() as number, 0, fadeMs)
  stationAmbience.once('fade', () => {
    if (!stationOn) stationAmbience.stop()
  })
}

/**
 * Sounds from someone behind you, right before a glance back. Mostly heavy
 * footsteps; now and then a cough, a laugh or keys jingling instead.
 * They creep in from silence and fade away.
 */
const PRESENCE = {
  sounds: {
    steps: { file: 'heavy-steps', volume: 0.22 },
    cough: { file: 'man-cough', volume: 0.15 },
    laugh: { file: ['man-laugh-1', 'man-laugh-2'], volume: 0.18 }, // your recordings, full length
    keys: { file: 'keys-jingle', volume: 0.14 },
  },
}
export type PresenceKind = keyof typeof PRESENCE.sounds
// each kind can have several recordings; one is picked at random
const presence = Object.fromEntries(
  Object.entries(PRESENCE.sounds).map(([k, s]) => [
    k,
    (Array.isArray(s.file) ? s.file : [s.file]).map((f) => new Howl({ src: [`/assets/audio/sfx/${f}.mp3`], volume: 0, preload: true })),
  ]),
) as Record<keyof typeof PRESENCE.sounds, Howl[]>

/** Plays one presence sound (laughs pick one of their recordings at random). */
export function playPresence(kind: PresenceKind = 'steps') {
  const variants = presence[kind]
  const howl = variants[Math.floor(Math.random() * variants.length)]
  const peak = PRESENCE.sounds[kind].volume
  const id = howl.play()
  howl.volume(0, id)
  howl.fade(0, peak, 900, id) // creep in
  const length = (howl.duration(id) || 2.6) * 1000
  setTimeout(() => howl.fade(peak, 0, 900, id), Math.max(600, length - 1000)) // and fade away
}

/** The station gate slamming shut. */
const clang = new Howl({ src: ['/assets/audio/sfx/metal-clang.mp3'], volume: 0.75, preload: true })
export const playClang = () => clang.play()

/** Faint heartbeat while running; fades in and out. */
const HEARTBEAT_VOLUME = 0.32
const heartbeat = new Howl({ src: ['/assets/audio/sfx/heartbeat-loop.mp3'], volume: 0, loop: true, preload: true })
let heartbeatOn = false
export function setHeartbeat(on: boolean) {
  if (on === heartbeatOn) return
  heartbeatOn = on
  if (on) {
    if (!heartbeat.playing()) heartbeat.play()
    heartbeat.fade(heartbeat.volume() as number, HEARTBEAT_VOLUME, 600)
  } else {
    heartbeat.fade(heartbeat.volume() as number, 0, 2500) // slows to nothing after you stop
    heartbeat.once('fade', () => {
      if (!heartbeatOn) heartbeat.pause()
    })
  }
}

/** Freezes every sound where it is (pause menu) and picks up again on resume. */
export function setAudioPaused(paused: boolean) {
  const ctx = Howler.ctx
  if (!ctx) return
  if (paused && ctx.state === 'running') void ctx.suspend()
  if (!paused && ctx.state === 'suspended') void ctx.resume()
}

/** Silences everything for good (leaving the game for the resources screen). */
export function stopAllAudio(fadeMs = 800) {
  ambienceOn = stationOn = escalatorOn = heartbeatOn = false
  setAudioPaused(false)
  const master = Howler.volume()
  const start = performance.now()
  const step = () => {
    const k = Math.min(1, (performance.now() - start) / fadeMs)
    Howler.volume(master * (1 - k))
    if (k < 1) requestAnimationFrame(step)
    else {
      Howler.stop()
      Howler.volume(master)
    }
  }
  step()
}
