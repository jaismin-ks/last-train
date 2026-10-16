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
  | 'epilogue' // the ending: the text home, the statistics
  | 'endCard'
  | 'credits'

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
  trainState: 'hidden' | 'arriving' | 'stopped' | 'riding' // riding: you're inside, doors left to the story
  inputLocked: boolean // cutscene moments: walking and looking are off
  fear: boolean // something nearby is frightening (heartbeat)
  countdown: number | null // seconds left to catch the train (null = no timer running)
  countdownLabel: string // what the countdown is to ("Station closes in")
  missedLine: string // what happened, on the missed screen
  missedHeading: string // headline on the missed screen
  missed: boolean // the section failed (countdown ran out, or he reached you)
  panic: boolean // frozen in fear: you can't move or look
  checkpoint: 'platform' | null // Try again on the platform starts you on the platform
  endingKind: 'followed' | 'ambiguous' // got off early (he followed) / got off at her stop
  /** What a train ritual is showing on screen: the phone (text / call), and whether the keys are out. */
  ritual: { phone: null | { kind: 'text'; typed: string; status: '' | 'sending' | 'failed' | 'delivered' } | { kind: 'call'; status: 'calling' | 'talking' | 'ended' }; keys: boolean }
  attempt: number // bumps on Try again, restarting the current section
  muted: boolean // sound off (M or the speaker button), remembered between visits
  volume: number // 0–1 master volume
  reduceMotion: boolean // no head bob or head tilt
  soundCaptions: boolean // show [footsteps behind you] etc. for story-critical sounds
  soundCaption: string | null // the sound caption showing right now
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
  setTrainState: (state: GameState['trainState']) => void
  setInputLocked: (locked: boolean) => void
  setFear: (fear: boolean) => void
  setCountdown: (seconds: number | null) => void
  startCountdown: (seconds: number, label: string, missedLine: string) => void
  setMissed: (missed: boolean) => void
  fail: (heading: string, line: string) => void
  setPanic: (panic: boolean) => void
  setCheckpoint: (checkpoint: 'platform' | null) => void
  setEndingKind: (kind: 'followed' | 'ambiguous') => void
  setRitual: (ritual: Partial<GameState['ritual']>) => void
  retry: () => void
  setMuted: (muted: boolean) => void
  setVolume: (volume: number) => void
  setReduceMotion: (on: boolean) => void
  setSoundCaptions: (on: boolean) => void
  setSoundCaption: (text: string | null) => void
}

/** Player settings survive a reload; storage can be blocked, so every access is guarded. */
const SETTINGS_KEY = 'last-train:settings'
type Settings = { muted: boolean; volume: number; reduceMotion: boolean; soundCaptions: boolean }
function loadSettings(): Settings {
  const fallback = {
    muted: false,
    volume: 1,
    reduceMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    soundCaptions: false,
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
    const { muted, volume, reduceMotion, soundCaptions } = get()
    saveSettings({ muted, volume, reduceMotion, soundCaptions })
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
  trainState: 'hidden',
  inputLocked: false,
  fear: false,
  countdown: null,
  countdownLabel: '',
  missedLine: '',
  missedHeading: 'You missed the last train.',
  missed: false,
  panic: false,
  checkpoint: null,
  endingKind: 'ambiguous',
  ritual: { phone: null, keys: false },
  attempt: 0,
  ...settings,
  soundCaption: null,
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
  setTrainState: (trainState) => set({ trainState }),
  setInputLocked: (inputLocked) => set({ inputLocked }),
  setFear: (fear) => set({ fear }),
  setCountdown: (countdown) => set({ countdown }),
  startCountdown: (countdown, countdownLabel, missedLine) =>
    set({ countdown, countdownLabel, missedLine, missedHeading: 'You missed the last train.' }),
  setMissed: (missed) => set({ missed }),
  fail: (missedHeading, missedLine) => set({ missed: true, missedHeading, missedLine, inputLocked: true, countdown: null }),
  setPanic: (panic) => set({ panic }),
  setCheckpoint: (checkpoint) => set({ checkpoint }),
  setEndingKind: (endingKind) => set({ endingKind }),
  setRitual: (ritual) => set((s) => ({ ritual: { ...s.ritual, ...ritual } })),
  retry: () =>
    set((s) => ({
      attempt: s.attempt + 1,
      missed: false,
      countdown: null,
      inputLocked: false,
      stamina: 1,
      running: false,
      fear: false,
      ritual: { phone: null, keys: false },
      stress: 0,
      panic: false,
      thought: null,
      caption: null,
      prompt: null,
      blackout: 0,
    })),
  setMuted: (muted) => saveAfter({ muted }),
  setVolume: (volume) => saveAfter({ volume: Math.max(0, Math.min(1, volume)), muted: volume > 0 ? false : get().muted }),
  setReduceMotion: (reduceMotion) => saveAfter({ reduceMotion }),
  setSoundCaptions: (soundCaptions) => saveAfter({ soundCaptions }),
  setSoundCaption: (soundCaption) => set({ soundCaption }),
  }
})
