import { useGame } from './store'
import { ContentWarning } from './ui/ContentWarning'
import { TitleCard } from './ui/TitleCard'
import { StartScreen } from './ui/StartScreen'
import { Experience } from './Experience'

export default function App() {
  const phase = useGame((s) => s.phase)

  if (phase === 'warning') return <ContentWarning />
  if (phase === 'title') return <TitleCard />
  if (phase === 'start') return <StartScreen />
  return <Experience />
}
