import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App'

// the animation editor, dev only (and Theatre itself then comes with the 3D code)
if (import.meta.env.DEV) await (await import('./theatre/project')).setupTheatre()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
