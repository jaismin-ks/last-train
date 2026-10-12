import { useGame } from './store'
import { ContentWarning } from './ui/ContentWarning'
import { TitleCard } from './ui/TitleCard'
import { StartScreen } from './ui/StartScreen'
import { FilmGrain } from './ui/FilmGrain'
import { Experience } from './Experience'

function Screen() {
  const phase = useGame((s) => s.phase)
  if (phase === 'warning') return <ContentWarning />
  if (phase === 'title') return <TitleCard />
  if (phase === 'start') return <StartScreen />
  return <Experience />
}

export default function App() {
  return (
    <>
      <Screen />
      <FilmGrain />
    </>
  )
}
