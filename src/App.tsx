import { lazy, Suspense, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { useGame } from './store'
import { LoadingScreen } from './ui/LoadingScreen'
import { ContentWarning } from './ui/ContentWarning'
import { StartScreen } from './ui/StartScreen'
import { FilmGrain } from './ui/FilmGrain'
import { Resources } from './ui/Resources'
import { Ending } from './ui/Ending'
import { Credits } from './ui/Credits'
import { AudioSettings, Hud } from './ui/Hud'
import { DevPanel } from './ui/DevPanel'

/**
 * The 3D part (three.js, the scenes) is most of the code: it comes in its own file,
 * fetched right away, so the first screen shows without waiting for it.
 */
const experience = import('./Experience')
const Experience = lazy(() => experience.then((m) => ({ default: m.Experience })))

function Screen() {
  const phase = useGame((s) => s.phase)
  // everything downloads first (dev ?phase= links skip straight in)
  const [loaded, setLoaded] = useState(phase !== 'warning')
  if (!loaded) return <LoadingScreen onReady={() => setLoaded(true)} />
  if (phase === 'warning') return <ContentWarning />
  if (phase === 'title' || phase === 'start') return <StartScreen /> // title and Begin are one screen
  if (phase === 'epilogue') return <Ending />
  if (phase === 'endCard') return <Resources />
  if (phase === 'credits') return <Credits />
  return (
    <Suspense fallback={null}>
      <Experience />
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <AudioSettings />
      <Screen />
      <Hud />
      {/* testing only: left out of the published build */}
      {import.meta.env.DEV && <DevPanel />}
      <FilmGrain />
      {/* page views, on Vercel (turned on in the project's Analytics tab) */}
      <Analytics />
    </>
  )
}
