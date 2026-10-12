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
  setPhase: (phase: Phase) => void
  setBattery: (battery: number) => void
  setStress: (stress: number) => void
  setBlackout: (blackout: number) => void
  setPhoneOpacity: (opacity: number) => void
  setPrompt: (prompt: string | null) => void
}

/** Dev only: start at any phase with ?phase=descent (etc.) in the URL. */
const devStartPhase = import.meta.env.DEV
  ? (new URLSearchParams(location.search).get('phase') as Phase | null)
  : null

export const useGame = create<GameState>((set) => ({
  phase: devStartPhase ?? 'warning',
  battery: 15,
  stress: 0,
  blackout: 0,
  phoneOpacity: 1,
  prompt: null,
  setPhase: (phase) => set({ phase }),
  setBattery: (battery) => set({ battery: Math.max(0, Math.min(100, battery)) }),
  setStress: (stress) => set({ stress: Math.max(0, Math.min(1, stress)) }),
  setBlackout: (blackout) => set({ blackout: Math.max(0, Math.min(1, blackout)) }),
  setPhoneOpacity: (phoneOpacity) => set({ phoneOpacity }),
  setPrompt: (prompt) => set({ prompt }),
}))
