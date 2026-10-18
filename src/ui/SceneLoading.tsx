import { useEffect, useRef, useState } from 'react'
import { LOADING_CARD, useGame } from '../store'
import s from './screens.module.css'

/**
 * On the black between scenes, while the next one gets built and sent to the
 * graphics card (see changeScene and Warmup): where you're going, e.g. "Entering the station".
 */
export function SceneLoading() {
  const loading = useGame((st) => st.loading)
  const [label, setLabel] = useState(loading)
  const [shown, setShown] = useState(false)
  const since = useRef(0)

  useEffect(() => {
    if (loading) {
      setLabel(loading)
      setShown(true)
      since.current = performance.now()
      return
    }
    // ready: fades out over the scene fading in, once it's been up long enough to read
    const left = LOADING_CARD.least * 1000 - (performance.now() - since.current)
    const t = setTimeout(() => setShown(false), Math.max(0, left))
    return () => clearTimeout(t)
  }, [loading])

  return (
    <div
      className={s.sceneLoading}
      style={{ opacity: shown ? 1 : 0, transitionDuration: `${LOADING_CARD.fadeIn}s` }}
      role="status"
      aria-hidden={!shown}
    >
      <p className={s.loadingTitle}>{label}</p>
      <div className={s.sceneLoadingBar} />
    </div>
  )
}
