import { create } from 'zustand'

/** Every beat of the experience, in order. See the project plan for details. */
export type Phase =
  | 'warning'
  | 'title'
  | 'start'
  | 'phoneIntro'
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
  setPhase: (phase: Phase) => void
  setBattery: (battery: number) => void
  setStress: (stress: number) => void
}

export const useGame = create<GameState>((set) => ({
  phase: 'warning',
  battery: 15,
  stress: 0,
  setPhase: (phase) => set({ phase }),
  setBattery: (battery) => set({ battery: Math.max(0, Math.min(100, battery)) }),
  setStress: (stress) => set({ stress: Math.max(0, Math.min(1, stress)) }),
}))
