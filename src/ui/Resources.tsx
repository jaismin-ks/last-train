import { RESOURCE_GROUPS, RESOURCES_SCREEN } from '../data/captions'
import { useGame } from '../store'
import { SupportButton } from './SupportButton'
import s from './hud.module.css'

/** Support resources: from the content warning, the pause menu, or the end of the story. */
export function Resources() {
  return (
    <main className={s.resources}>
      <div className={s.resourcesInner}>
        <h1 className={s.resourcesTitle}>{RESOURCES_SCREEN.title}</h1>
        <p className={s.lede}>{RESOURCES_SCREEN.lede}</p>

        {RESOURCE_GROUPS.map((group) => (
          <section key={group.title} className={s.group}>
            <h2 className={s.groupTitle}>{group.title}</h2>
            <ul className={s.list} style={{ listStyle: 'none' }}>
              {group.items.map((r) => (
                <li key={r.name} className={s.item}>
                  <a className={s.itemName} href={r.url} target="_blank" rel="noreferrer">
                    {r.name}
                  </a>
                  <span className={s.itemContact}>
                    {r.href ? (
                      <a href={r.href} target={r.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                        {r.contact}
                      </a>
                    ) : (
                      r.contact
                    )}{' '}
                    · {r.note}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className={s.emergency}>{RESOURCES_SCREEN.emergency}</p>

        <SupportButton />

        <button className={s.button} onClick={() => location.assign(location.pathname)}>
          Back to the start
        </button>
        <button className={`${s.button} ${s.quiet}`} onClick={() => useGame.getState().setPhase('credits')}>
          Credits
        </button>
      </div>
    </main>
  )
}
