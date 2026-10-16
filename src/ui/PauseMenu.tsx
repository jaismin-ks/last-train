import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store'
import { stopAllAudio } from '../audio/sounds'
import { IN_GAME } from './Hud'
import s from './hud.module.css'

/** Leaves the game for the resources screen, cleanly. */
export function goToResources() {
  const st = useGame.getState()
  if (document.pointerLockElement) document.exitPointerLock()
  stopAllAudio()
  st.setPaused(false)
  st.setBlackout(0)
  st.setPrompt(null)
  st.setCaption(null)
  st.setThought(null)
  st.setPhase('endCard')
}

/** Starts again from the content warning, with a fresh page (clears all scene memory). */
const restart = () => location.assign(location.pathname)

/** Pause menu (Esc, P or the pause button): resume, settings, controls, resources. */
export function PauseMenu() {
  const phase = useGame((st) => st.phase)
  const paused = useGame((st) => st.paused)
  const muted = useGame((st) => st.muted)
  const volume = useGame((st) => st.volume)
  const reduceMotion = useGame((st) => st.reduceMotion)
  const { setPaused, setMuted, setVolume, setReduceMotion } = useGame.getState()
  const [confirm, setConfirm] = useState<null | 'resources' | 'restart'>(null)
  const resumeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setConfirm(null)
    if (paused) resumeRef.current?.focus()
  }, [paused])

  if (!paused || !IN_GAME.includes(phase)) return null

  const resume = () => {
    setPaused(false)
    // On the platform, take the mouse back straight away (needs this click)
    if (phase === 'platform') {
      const canvas = document.querySelector('canvas')
      try {
        void (canvas?.requestPointerLock() as unknown as Promise<void> | undefined)?.catch?.(() => {})
      } catch {
        // browser refused (too soon after Esc): clicking the view locks it
      }
    }
  }

  return (
    <div role="dialog" aria-modal aria-label="Paused" className={s.overlay}>
      <div className={s.panel}>
        <h2 className={s.heading}>Paused</h2>

        {confirm ? (
          <div className={s.actions}>
            <p className={s.warn}>
              {confirm === 'resources'
                ? 'This ends the story here and takes you to support resources.'
                : 'This starts again from the beginning.'}
            </p>
            <button className={s.button} onClick={confirm === 'resources' ? goToResources : restart}>
              {confirm === 'resources' ? 'Go to resources' : 'Restart'}
            </button>
            <button className={`${s.button} ${s.quiet}`} onClick={() => setConfirm(null)}>
              Back
            </button>
          </div>
        ) : (
          <div className={s.actions}>
            <button ref={resumeRef} className={s.button} onClick={resume}>
              Resume
            </button>
            <button className={s.button} onClick={() => setConfirm('resources')}>
              Skip to resources
            </button>
            <button className={`${s.button} ${s.quiet}`} onClick={() => setConfirm('restart')}>
              Restart
            </button>
          </div>
        )}

        <div className={s.settings}>
          <div className={s.row}>
            <span>Sound</span>
            <button className={s.toggle} aria-pressed={!muted} onClick={() => setMuted(!muted)}>
              {muted ? 'Off' : 'On'}
            </button>
          </div>
          <label className={s.row}>
            <span>Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
          <div className={s.row}>
            <span>Reduce motion</span>
            <button className={s.toggle} aria-pressed={reduceMotion} onClick={() => setReduceMotion(!reduceMotion)}>
              {reduceMotion ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <div className={s.settings}>
          <span className={s.label}>Controls</span>
          <div className={s.controls}>
            <kbd>W / S</kbd>
            <span>walk forward / back</span>
            <kbd>A / D</kbd>
            <span>step sideways (platform)</span>
            <kbd>Mouse</kbd>
            <span>look around (click to grab the mouse)</span>
            <kbd>Shift</kbd>
            <span>run</span>
            <kbd>M</kbd>
            <span>sound on / off</span>
            <kbd>Esc</kbd>
            <span>pause / resume</span>
          </div>
        </div>
      </div>
    </div>
  )
}
