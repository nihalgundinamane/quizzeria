import { useGame } from './context/GameContext'
import { useEffect, useRef, useState } from 'react'
import LandingPage        from './pages/LandingPage'
import TeamEntryPage      from './pages/TeamEntryPage'
import TossPage           from './pages/TossPage'
import AdminPanel         from './components/common/AdminPanel'
import RoundSelectPage    from './pages/RoundSelectPage'
import RoundIntroPage     from './pages/RoundIntroPage'
import RulesPage          from './pages/RulesPage'
import CategorySelectPage from './pages/CategorySelectPage'
import QuestionPlayPage   from './pages/QuestionPlayPage'
import Round02PlayPage    from './pages/Round02PlayPage'
import Round03PlayPage    from './pages/Round03PlayPage'
import Round04PlayPage    from './pages/Round04PlayPage'
import Round05PlayPage    from './pages/Round05PlayPage'
import Round06PlayPage    from './pages/Round06PlayPage'
import Round07PlayPage    from './pages/Round07PlayPage'
import Round08PlayPage    from './pages/Round08PlayPage'
import WinnerPage         from './pages/WinnerPage'
import HalftimePage       from './pages/HalftimePage'

const IDLE_MS = 90_000  // 90 seconds

/* ── Breathing QUIZZERIA letters ── */
function IdleScreensaver({ onWake }) {
  const letters = 'QUIZZERIA'.split('')
  return (
    <div
      onClick={onWake}
      onKeyDown={onWake}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(6,6,14,0.93)',
        backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        animation: 'idleFadeIn 1.2s ease forwards',
      }}
    >
      {/* Breathing logo */}
      <div style={{ display: 'flex', gap: 6 }}>
        {letters.map((l, i) => (
          <span key={i} style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 52,
            fontWeight: 900,
            color: '#FFD700',
            textShadow: '0 0 40px rgba(255,215,0,0.4), 0 0 80px rgba(255,215,0,0.15)',
            animation: `idleBreathe 3.5s ease-in-out ${i * 0.18}s infinite`,
            display: 'inline-block',
          }}>{l}</span>
        ))}
      </div>
      <div style={{
        marginTop: 32,
        fontSize: 11,
        letterSpacing: 4,
        color: 'rgba(255,215,0,0.25)',
        fontFamily: 'Inter, sans-serif',
        textTransform: 'uppercase',
        animation: 'idleBreathe 3.5s ease-in-out 1.5s infinite',
      }}>
        Tap anywhere to continue
      </div>
    </div>
  )
}

export default function App() {
  const { phase } = useGame()
  const [idle, setIdle] = useState(false)
  const timerRef = useRef(null)

  const resetIdle = () => {
    setIdle(false)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setIdle(true), IDLE_MS)
  }

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }))
    timerRef.current = setTimeout(() => setIdle(true), IDLE_MS)
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle))
      clearTimeout(timerRef.current)
    }
  }, [])

  const map = {
    landing:        <LandingPage />,
    teamEntry:      <TeamEntryPage />,
    toss:           <TossPage />,
    roundSelect:    <RoundSelectPage />,
    roundIntro:     <RoundIntroPage />,
    rules:          <RulesPage />,
    round01Rules:   <RulesPage />,
    categorySelect: <CategorySelectPage />,
    questionPlay:   <QuestionPlayPage />,
    round02Play:    <Round02PlayPage />,
    round03Play:    <Round03PlayPage />,
    round04Play:    <Round04PlayPage />,
    round05Play:    <Round05PlayPage />,
    round06Play:    <Round06PlayPage />,
    round07Play:    <Round07PlayPage />,
    round08Play:    <Round08PlayPage />,
    winner:         <WinnerPage />,
    halftime:       <HalftimePage />,
  }
  return (
    <>
      {map[phase] ?? <LandingPage />}
      <AdminPanel />
      {idle && <IdleScreensaver onWake={resetIdle} />}
    </>
  )
}
