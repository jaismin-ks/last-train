import { create } from 'zustand'

/** Every beat of the experience, in order. See the project plan for details. */
export type Phase =
  | 'warning'
  | 'title'
  | 'start'
  | 'phoneIntro'
  | 'descent' // cutscene: sky fades in, camera drops to street level
  | 'street'
  | 'platform'
  | 'ride'
  | 'tunnel'
  | 'lastStop'
  | 'endCard'

type GameState = {
  phase: Phase
  battery: number // percent
  stress: number // 0–1, drives audio, vignette and FOV
  blackout: number // 0–1, full-screen black fade between scenes
  phoneOpacity: number // 0–1, phone fades out as the descent begins
  prompt: string | null // on-screen interaction hint, e.g. "Press E to enter"
  caption: { text: string; sub?: string } | null // instruction caption at the bottom of the screen
  thought: string | null // inner-thought line in her voice
  paused: boolean // pause menu open (Esc)
  stamina: number // 0–1, running energy
  trainDoorsOpen: boolean // platform-side train doors
  platformLightsOn: boolean // station lights (go dark later in the story)
  running: boolean
  muted: boolean // sound off (M or the speaker button), remembered between visits
  volume: number // 0–1 master volume
  reduceMotion: boolean // no head bob or head tilt
  setPhase: (phase: Phase) => void
  setBattery: (battery: number) => void
  setStress: (stress: number) => void
  setBlackout: (blackout: number) => void
  setPhoneOpacity: (opacity: number) => void
  setPrompt: (prompt: string | null) => void
  setCaption: (caption: { text: string; sub?: string } | null) => void
  setThought: (thought: string | null) => void
  setPaused: (paused: boolean) => void
  setStamina: (stamina: number, running: boolean) => void
  setTrainDoorsOpen: (open: boolean) => void
  setPlatformLightsOn: (on: boolean) => void
  setMuted: (muted: boolean) => void
  setVolume: (volume: number) => void
  setReduceMotion: (on: boolean) => void
}

/** Player settings survive a reload; storage can be blocked, so every access is guarded. */
const SETTINGS_KEY = 'last-train:settings'
type Settings = { muted: boolean; volume: number; reduceMotion: boolean }
function loadSettings(): Settings {
  const fallback = {
    muted: false,
    volume: 1,
    reduceMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') }
  } catch {
    return fallback
  }
}
function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {
    // private mode etc.: settings just don't persist
  }
}
const settings = loadSettings()

/** Dev only: start at any phase with ?phase=descent (etc.) in the URL. */
const devStartPhase = import.meta.env.DEV
  ? (new URLSearchParams(location.search).get('phase') as Phase | null)
  : null

export const useGame = create<GameState>((set, get) => {
  const saveAfter = (patch: Partial<Settings>) => {
    set(patch)
    const { muted, volume, reduceMotion } = get()
    saveSettings({ muted, volume, reduceMotion })
  }
  return {
  phase: devStartPhase ?? 'warning',
  battery: 15,
  stress: 0,
  blackout: 0,
  phoneOpacity: 1,
  prompt: null,
  caption: null,
  thought: null,
  paused: false,
  stamina: 1,
  trainDoorsOpen: false,
  platformLightsOn: true,
  running: false,
  ...settings,
  setPhase: (phase) => set({ phase }),
  setBattery: (battery) => set({ battery: Math.max(0, Math.min(100, battery)) }),
  setStress: (stress) => set({ stress: Math.max(0, Math.min(1, stress)) }),
  setBlackout: (blackout) => set({ blackout: Math.max(0, Math.min(1, blackout)) }),
  setPhoneOpacity: (phoneOpacity) => set({ phoneOpacity }),
  setPrompt: (prompt) => set({ prompt }),
  setCaption: (caption) => set({ caption }),
  setThought: (thought) => set({ thought }),
  setPaused: (paused) => set({ paused }),
  setStamina: (stamina, running) => set({ stamina, running }),
  setTrainDoorsOpen: (trainDoorsOpen) => set({ trainDoorsOpen }),
  setPlatformLightsOn: (platformLightsOn) => set({ platformLightsOn }),
  setMuted: (muted) => saveAfter({ muted }),
  setVolume: (volume) => saveAfter({ volume: Math.max(0, Math.min(1, volume)), muted: volume > 0 ? false : get().muted }),
  setReduceMotion: (reduceMotion) => saveAfter({ reduceMotion }),
  }
})
