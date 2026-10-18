import { create } from 'zustand'

/**
 * How far the downloads have got, for the loading and start screens. The 3D code
 * (and the model downloads it starts) arrives in its own file after the first
 * screen is up, and reports here (see Experience); until then it's 0%.
 */
export const useLoad = create<{ active: boolean; progress: number; total: number }>(() => ({
  active: true,
  progress: 0,
  total: 0,
}))
