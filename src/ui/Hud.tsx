import { useEffect, useState } from 'react'
import { Howler } from 'howler'
import { useGame, type Phase } from '../store'
import { setAudioPaused, setFootsteps } from '../audio/sounds'
import s from './hud.module.css'

/** Phases where the game is running: the corner controls show and Esc pauses. */
export const IN_GAME: Phase[] = ['phoneIntro', 'descent', 'street', 'platform', 'ride', 'tunnel', 'lastStop']

/** Seconds without moving the mouse before the corner controls dim out of the way. */
const IDLE_AFTER = 2.5

/** Keeps Howler in step with the sound settings, on every screen. */
export function AudioSettings() {
  const muted = useGame((st) => st.muted)
  const volume = useGame((st) => st.volume)
  useEffect(() => {
    Howler.mute(muted)
  }, [muted])
  useEffect(() => {
    Howler.volume(volume)
  }, [volume])
  return null
}

/**
 * Corner controls that stay on screen for the whole game: sound on/off and
 * pause. Also owns the keys (Esc / P pause, M mute) and pauses by itself when
 * the tab is hidden.
 */
export function Hud() {
  const phase = useGame((st) => st.phase)
  const paused = useGame((st) => st.paused)
  const muted = useGame((st) => st.muted)
  const setPaused = useGame((st) => st.setPaused)
  const setMuted = useGame((st) => st.setMuted)
  const [idle, setIdle] = useState(false)
  const inGame = IN_GAME.includes(phase)

  // Keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useGame.getState()
      if (!IN_GAME.includes(st.phase) || e.repeat) return
      if (e.code === 'KeyM') st.setMuted(!st.muted)
      if (e.code === 'Escape' || e.code === 'KeyP') st.setPaused(!st.paused)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Pause by itself when the player leaves the tab
  useEffect(() => {
    const onVisibility = () => {
      const st = useGame.getState()
      if (document.hidden && IN_GAME.includes(st.phase) && !st.paused) st.setPaused(true)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Freeze every sound while paused
  useEffect(() => {
    setAudioPaused(paused)
    if (paused) setFootsteps(0)
  }, [paused])

  // Dim when the mouse is still
  useEffect(() => {
    if (!inGame) return
    let timer = setTimeout(() => setIdle(true), IDLE_AFTER * 1000)
    const wake = () => {
      setIdle(false)
      clearTimeout(timer)
      timer = setTimeout(() => setIdle(true), IDLE_AFTER * 1000)
    }
    window.addEventListener('mousemove', wake)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', wake)
    }
  }, [inGame])

  if (!inGame || paused) return null

  return (
    <div className={`${s.hud} ${idle ? s.idle : ''}`}>
      <button
        className={s.iconButton}
        onClick={() => setMuted(!muted)}
        aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
        aria-pressed={muted}
      >
        {muted ? <SoundOffIcon /> : <SoundOnIcon />}
      </button>
      <button className={s.iconButton} onClick={() => setPaused(true)} aria-label="Pause">
        <PauseIcon />
      </button>
      <span className={s.key} aria-hidden>
        M sound · Esc pause
      </span>
    </div>
  )
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

function SoundOnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  )
}

function SoundOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M9 6v12M15 6v12" />
    </svg>
  )
}
