import { RESOURCE_GROUPS, RESOURCES_SCREEN } from '../data/captions'
import { useGame } from '../store'
import { SupportButton } from './SupportButton'
import s from './resources.module.css'

/** Support resources: from the content warning, the pause menu, or the end of the story. */
export function Resources() {
  return (
    <main className={s.page}>
      <div className={s.inner}>
        <header className={s.header}>
          <h1 className={s.title}>{RESOURCES_SCREEN.title}</h1>
          <p className={s.lede}>{RESOURCES_SCREEN.lede}</p>
        </header>

        <p className={s.emergency} role="note">
          <span className={s.dot} aria-hidden />
          {RESOURCES_SCREEN.emergency}
        </p>

        <div className={s.groups}>
          {RESOURCE_GROUPS.map((group) => (
            <section key={group.title} className={s.group}>
              <h2 className={s.groupTitle}>{group.title}</h2>
              {group.items.map((r) => (
                <div key={r.name} className={s.item}>
                  <a className={s.name} href={r.url} target="_blank" rel="noreferrer">
                    {r.name}
                  </a>
                  {r.href ? (
                    <a className={s.contact} href={r.href} target={r.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                      {r.contact}
                    </a>
                  ) : (
                    <span className={s.contact}>{r.contact}</span>
                  )}
                  <span className={s.note}>{r.note}</span>
                </div>
              ))}
            </section>
          ))}
        </div>

        <div className={s.support}>
          <SupportButton />
        </div>

        <nav className={s.nav}>
          <button className={s.navButton} onClick={() => location.assign(location.pathname)}>
            Back to the start
          </button>
          <button className={`${s.navButton} ${s.quiet}`} onClick={() => useGame.getState().setPhase('credits')}>
            Credits
          </button>
        </nav>
      </div>
    </main>
  )
}
