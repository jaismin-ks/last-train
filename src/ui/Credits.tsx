import { useEffect, useRef, useState } from 'react'
import { CREDITS, CREDITS_INTRO, REFERENCES, type Credit } from '../data/credits'
import { useGame } from '../store'
import { isTouch } from '../systems/device'
import s from './credits.module.css'

/**
 * Credits like the end of a film, but read at your own pace: the work on the
 * left, the people on the right, meeting at the centre. Starts at the top;
 * a hint at the bottom says there's more until you get there.
 */
export function Credits() {
  const setPhase = useGame((st) => st.setPhase)
  const page = useRef<HTMLElement>(null)
  const [atEnd, setAtEnd] = useState(false) // the scroll hint goes once you reach the bottom

  useEffect(() => {
    const el = page.current
    if (!el) return
    const check = () => setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 80)
    check()
    el.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      el.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return (
    <main ref={page} className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>{CREDITS_INTRO.title}</h1>
        <p className={s.subtitle}>{CREDITS_INTRO.subtitle}</p>
        <p className={s.by}>{CREDITS_INTRO.by}</p>
      </header>

      {CREDITS.map((group) => (
        <Section key={group.title} title={group.title} items={group.items.filter((c) => !c.todo)} />
      ))}
      <Section title="References" items={REFERENCES} />

      {/* a quiet hint that there's more below */}
      <div className={`${s.scrollHint} ${atEnd ? s.scrollHintGone : ''}`} aria-hidden>
        <span>{isTouch ? 'Swipe up for more' : 'Scroll for more'}</span>
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
