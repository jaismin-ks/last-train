import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../store'
import { ENDING } from '../data/ending'
import { playKeyTap, playMessageIn, playMessageOut } from '../audio/sounds'
import s from './ending.module.css'

const ms = (seconds: number) => seconds * 1000

/**
 * The ending (see data/ending.ts): the text home to Mom, then the lines and
 * statistics one at a time, then the resources screen. Click / any key moves on.
 */
export function Ending() {
  const setPhase = useGame((st) => st.setPhase)
  const kind = ENDING.kinds[useGame((st) => st.endingKind)]
  // this ending's opening lines, then the statistics and the last line
  const screens = useMemo(
    () => [...kind.opening.map((lines, i) => ({ lines, hold: i === 0 ? 3 : 4 })), ...ENDING.screens],
    [kind],
  )
  // step -1: black; 0: chat; 1..n: screens
  const [step, setStep] = useState(-1)
  const [leaving, setLeaving] = useState(false)
  const timers = useRef<number[]>([])
  const later = (fn: () => void, seconds: number) => timers.current.push(window.setTimeout(fn, ms(seconds)))
  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const total = screens.length
  const next = useCallback(() => {
    clear()
    setLeaving(true)
    later(() => {
      setLeaving(false)
      setStep((n) => {
        if (n >= total) {
          setPhase('endCard')
          return n
        }
        return n + 1
      })
    }, ENDING.fade)
  }, [total, setPhase])

  // Black, then the chat
  useEffect(() => {
    later(() => setStep(0), ENDING.startDelay)
    return clear
  }, [])

  // Each line screen holds, then moves on by itself
  useEffect(() => {
    if (step < 1) return
    const screen = screens[step - 1]
    later(next, ENDING.fade + screen.hold)
  }, [step, next, screens])

  // Click or a key: on to the next screen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.code === 'Escape' || e.code === 'Tab') return
      if (step >= 0 && !leaving) next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, leaving, next])

  const style = { ['--fade' as string]: `${ENDING.fade}s` }
  const screen = step >= 1 ? (screens[step - 1] as (typeof ENDING.screens)[number]) : null

  return (
    <main className={s.ending} style={style} onClick={() => step >= 0 && !leaving && next()}>
      {step === 0 && <TextHome typedText={kind.typed} send={kind.send} jess={kind.jess} leaving={leaving} onDone={next} />}
      {screen && (
        <div key={step} className={`${s.step} ${leaving ? s.leaving : ''}`}>
          {screen.lines.map((l) => (
            <p key={l} className={`${s.line} ${screen.final ? s.final : ''}`}>
              {l}
            </p>
          ))}
          {screen.source && (
            <p className={s.source}>
              {screen.url ? (
                <a href={screen.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  {screen.source}
                </a>
              ) : (
                screen.source
              )}
            </p>
          )}
        </div>
      )}
      <button
        className={s.skip}
        onClick={(e) => {
          e.stopPropagation()
          clear()
          setPhase('endCard')
        }}
      >
        Skip
      </button>
    </main>
  )
}

/** The chat with Mom from the phone scene; a reply types itself out (and sends, or doesn't). */
function TextHome({ typedText, send, jess, leaving, onDone }: { typedText: string; send: boolean; jess: string; leaving: boolean; onDone: () => void }) {
  const c = ENDING.chat
  const [typed, setTyped] = useState('')
  const [sent, setSent] = useState(false)
  const [delivered, setDelivered] = useState(false)
  const [jessIn, setJessIn] = useState(false) // Jess's message arrives as a notification

  useEffect(() => {
    const t: number[] = []
    const at = (sec: number, fn: () => void) => t.push(window.setTimeout(fn, ms(sec)))
    const start = ENDING.fade + c.typeDelay
    ;[...typedText].forEach((_, i) =>
      at(start + i * c.perLetter, () => {
        setTyped(typedText.slice(0, i + 1))
        playKeyTap()
      }),
    )
    const sendAt = start + typedText.length * c.perLetter + 0.6
    if (!send) {
      // she never sends it: the caret just blinks, and Jess is asking where she is
      at(sendAt + 0.8, () => {
        setJessIn(true)
        playMessageIn()
      })
      at(sendAt + c.hold + 1.5, onDone)
      return () => t.forEach(clearTimeout)
    }
    at(sendAt, () => {
      setSent(true)
      setTyped('')
      playMessageOut()
    })
    at(sendAt + 1.2, () => setDelivered(true))
    at(sendAt + 2.6, () => {
      setJessIn(true)
      playMessageIn()
    })
    at(sendAt + 2.6 + c.hold, onDone)
    return () => t.forEach(clearTimeout)
  }, [c, onDone, typedText, send, jess])

  return (
    <div className={`${s.step} ${leaving ? s.leaving : ''}`}>
      <div className={s.chat}>
        {jessIn && (
          <div className={s.notification}>
            <span className={s.notificationFrom}>Jess (work)</span>
            <span>{jess}</span>
          </div>
        )}
        <div className={s.time}>{c.earlierTime}</div>
        {c.earlier.map((m) => (
          <div key={m.text} className={`${s.bubble} ${m.from === 'mom' ? s.mom : s.me}`}>
            {m.text}
          </div>
        ))}
        {sent && (
          <>
            <div className={s.time}>{c.nowTime}</div>
            <div className={`${s.bubble} ${s.me}`}>{typedText}</div>
          </>
        )}
        {delivered && <div className={s.delivered}>Delivered</div>}
        <div className={s.composer}>
          <span className={s.composerText}>
            {typed}
            {!sent && <span className={s.caret} />}
          </span>
          <span className={`${s.send} ${typed ? s.sendReady : ''}`} />
        </div>
      </div>
    </div>
  )
}
