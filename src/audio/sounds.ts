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
