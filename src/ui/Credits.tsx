import { useEffect, useRef, useState } from 'react'
import { CREDITS, CREDITS_INTRO, REFERENCES, type Credit } from '../data/credits'
import { useGame } from '../store'
import s from './credits.module.css'

/** How fast the credits roll (pixels per second). */
const ROLL_SPEED = 38

/**
 * Credits, rolled like the end of a film: the work on the left, the people on
 * the right, meeting at the centre. They roll up by themselves; scroll, drag
 * or press a key to take over.
 */
export function Credits() {
  const setPhase = useGame((st) => st.setPhase)
  const page = useRef<HTMLElement>(null)
  const [atEnd, setAtEnd] = useState(false) // the scroll hint goes once you reach the bottom

  // Roll upward until the reader takes over (or it reaches the end)
  useEffect(() => {
    const el = page.current
    if (!el) return
    let rolling = !matchMedia('(prefers-reduced-motion: reduce)').matches
    let last = performance.now()
    let pos = 0
    let raf = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (rolling) {
        pos += ROLL_SPEED * dt
        el.scrollTop = pos
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) rolling = false
      }
      setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 80)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const stop = () => (rolling = false)
    el.addEventListener('wheel', stop, { passive: true })
    el.addEventListener('touchstart', stop, { passive: true })
    window.addEventListener('keydown', stop)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('wheel', stop)
      el.removeEventListener('touchstart', stop)
      window.removeEventListener('keydown', stop)
    }
  }, [])

  return (
    <main ref={page} className={s.page}>
      <div className={s.lead} />
      <header className={s.header}>
        <h1 className={s.title}>{CREDITS_INTRO.title}</h1>
        <p className={s.subtitle}>{CREDITS_INTRO.subtitle}</p>
        <p className={s.by}>{CREDITS_INTRO.by}</p>
      </header>

      {CREDITS.map((group) => (
        <Section key={group.title} title={group.title} items={group.items.filter((c) => !c.todo)} />
      ))}
      <Section title="References" items={REFERENCES} />

      {/* a quiet hint that there's more below (they roll by themselves, and you can scroll) */}
      <div className={`${s.scrollHint} ${atEnd ? s.scrollHintGone : ''}`} aria-hidden>
        <span>Scroll</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      <footer className={s.footer}>
        <button className={s.back} onClick={() => setPhase('endCard')}>
          Back
        </button>
      </footer>
    </main>
  )
}

/** One block of credits: a centred heading, then work | person rows split at the centre. */
function Section({ title, items }: { title: string; items: Credit[] }) {
  if (!items.length) return null
  return (
    <section className={s.section}>
      <h2 className={s.heading}>{title}</h2>
      {items.map((c) => (
        <div key={c.what + c.who} className={s.row}>
          <span className={s.role}>
            {c.url ? (
              <a href={c.url} target="_blank" rel="noreferrer">
                {c.what}
              </a>
            ) : (
              c.what
            )}
          </span>
          <span className={s.name}>
            {c.whoUrl ? (
              <a href={c.whoUrl} target="_blank" rel="noreferrer">
                {c.who}
              </a>
            ) : (
              c.who
            )}
            {(c.where || c.license) && <span className={s.meta}>{[c.where, c.license].filter(Boolean).join(' · ')}</span>}
          </span>
        </div>
      ))}
    </section>
  )
}
