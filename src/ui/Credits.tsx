import { useEffect, useRef } from 'react'
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

      <footer className={s.footer}>
        <p className={s.thanks}>Text the people you love when you get home.</p>
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
            {c.who}
            {(c.where || c.license) && <span className={s.meta}>{[c.where, c.license].filter(Boolean).join(' · ')}</span>}
          </span>
        </div>
      ))}
    </section>
  )
}
