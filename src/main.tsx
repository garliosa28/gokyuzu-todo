import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import { startSync } from './ui/syncController'
import { startUpdates } from './ui/updates'
import './ui/styles.css'

startUpdates()
startSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
