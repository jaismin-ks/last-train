import { RESOURCES, RESOURCES_SCREEN } from '../data/captions'
import { useGame } from '../store'
import s from './hud.module.css'

/** Support resources: from the content warning, the pause menu, or the end of the story. */
export function Resources() {
  return (
    <main className={s.resources}>
      <div className={s.resourcesInner}>
        <h1 className={s.resourcesTitle}>{RESOURCES_SCREEN.title}</h1>
        <p className={s.lede}>{RESOURCES_SCREEN.lede}</p>

        <ul className={s.list} style={{ listStyle: 'none' }}>
          {RESOURCES.map((r) => (
            <li key={r.name} className={s.item}>
              <span className={s.itemName}>{r.name}</span>
              <span className={s.itemContact}>
                <a href={`tel:${r.tel}`}>{r.contact}</a> · {r.note}
              </span>
            </li>
          ))}
        </ul>

        <p className={s.emergency}>{RESOURCES_SCREEN.emergency}</p>

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
