import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'
import { isStandaloneDisplayMode, startViewportHeightLock } from './utils/viewport'
import { initGlobalPressAnimations } from './utils/animations'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker in production only
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // fail silently
    })
  })
}

// Stabilize viewport in standalone/PWA to prevent creeping scroll on iOS
if (isStandaloneDisplayMode()) {
  startViewportHeightLock()
}

// Initialize global press micro-interactions
initGlobalPressAnimations()
