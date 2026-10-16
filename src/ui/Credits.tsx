import { CREDITS, CREDITS_INTRO, CREDITS_NOTE } from '../data/credits'
import { useGame } from '../store'
import s from './credits.module.css'

/** Credits: every model, sound, image and font in the game, with its author and licence. */
export function Credits() {
  const setPhase = useGame((st) => st.setPhase)
  return (
    <main className={s.page}>
      <div className={s.inner}>
        <header className={s.header}>
          <h1 className={s.title}>{CREDITS_INTRO.title}</h1>
          <p className={s.subtitle}>{CREDITS_INTRO.subtitle}</p>
          <p className={s.by}>{CREDITS_INTRO.by}</p>
        </header>

        {CREDITS.map((group) => {
          const items = group.items.filter((c) => !c.todo)
          if (!items.length) return null
          return (
            <section key={group.title} className={s.group}>
              <h2 className={s.groupTitle}>{group.title}</h2>
              <ul className={s.list}>
                {items.map((c) => (
                  <li key={c.what + c.who} className={s.item}>
                    <span className={s.what}>
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noreferrer">
                          {c.what}
                        </a>
                      ) : (
                        c.what
                      )}
                    </span>
                    <span className={s.meta}>
                      {c.who}
                      {c.where && ` · ${c.where}`}
                      {c.license && ` · ${c.license}`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        <p className={s.note}>{CREDITS_NOTE}</p>
        <button className={s.back} onClick={() => setPhase('endCard')}>
          Back
        </button>
      </div>
    </main>
  )
}
