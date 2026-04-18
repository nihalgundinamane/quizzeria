import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import { GameProvider } from './context/GameContext.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

// Init theme from localStorage before first render
const savedTheme = (() => { try { return localStorage.getItem('quizzeria-theme') || 'dark' } catch { return 'dark' } })()
document.documentElement.setAttribute('data-theme', savedTheme)
document.body.setAttribute('data-theme', savedTheme)

ReactDOM.createRoot(document.getElementById('root')).render(
  <GameProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </GameProvider>
)
