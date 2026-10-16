import { useGame } from './store'
import { ContentWarning } from './ui/ContentWarning'
import { TitleCard } from './ui/TitleCard'
import { StartScreen } from './ui/StartScreen'
import { FilmGrain } from './ui/FilmGrain'
import { Experience } from './Experience'
import { Resources } from './ui/Resources'
import { Ending } from './ui/Ending'
import { Credits } from './ui/Credits'
import { AudioSettings, Hud } from './ui/Hud'
import { DevPanel } from './ui/DevPanel'

function Screen() {
  const phase = useGame((s) => s.phase)
  if (phase === 'warning') return <ContentWarning />
  if (phase === 'title') return <TitleCard />
  if (phase === 'start') return <StartScreen />
  if (phase === 'epilogue') return <Ending />
  if (phase === 'endCard') return <Resources />
  if (phase === 'credits') return <Credits />
  return <Experience />
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
    </>
  )
}
