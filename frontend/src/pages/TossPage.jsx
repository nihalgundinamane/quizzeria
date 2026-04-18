import { useState, useEffect, useRef } from 'react'
import { useGame } from '../context/GameContext'
import { sounds } from '../utils/sounds'

const STAGES = {
  SELECT_CALLER: 'select_caller',  // Pick which team calls
  CALLING:       'calling',         // Chosen team picks H or T
  FLIPPING:      'flipping',        // Coin spinning
  RESULT:        'result',          // Winner revealed
}

const GOLD  = '#FFD700'
const AMBER = '#FFA500'

export default function TossPage() {
  const { teams, setTossWinner, setPhase } = useGame()
  const [stage,       setStage]       = useState(STAGES.SELECT_CALLER)
  const [caller,      setCaller]       = useState(null)   // 1 or 2 — who calls
  const [call,        setCall]         = useState(null)   // 'heads' or 'tails'
  const [coinResult,  setCoinResult]   = useState(null)   // 'heads' or 'tails' — what landed
  const [winner,      setWinner]       = useState(null)   // 1 or 2
  const [exiting,     setExiting]      = useState(false)
  const [confetti,    setConfetti]     = useState([])
  const [drumTick,    setDrumTick]     = useState(0)
  const drumRef = useRef(null)

  const callerName = caller === 1 ? teams.team1 : teams.team2
  const callerColor = caller === 1 ? GOLD : AMBER
  const winnerName  = winner === 1 ? teams.team1 : teams.team2
  const winnerColor = winner === 1 ? GOLD : AMBER

  // Drum roll tick while flipping
  useEffect(() => {
    if (stage !== STAGES.FLIPPING) return
    drumRef.current = setInterval(() => { setDrumTick(t => t + 1); sounds.drumBeat() }, 80)
    return () => clearInterval(drumRef.current)
  }, [stage])

  // Toss winner reveal sound
  useEffect(() => {
    if (stage !== STAGES.RESULT) return
    setTimeout(() => sounds.tossReveal(), 400)
    const pieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.2,
      dur: 2.5 + Math.random() * 2,
      color: [GOLD, AMBER, '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1'][Math.floor(Math.random() * 6)],
      size: 6 + Math.random() * 10,
      rotation: Math.random() * 360,
    }))
    setConfetti(pieces)
  }, [stage])

  const handleSelectCaller = (teamNum) => {
    setCaller(teamNum)
    setTimeout(() => setStage(STAGES.CALLING), 300)
  }

  const handleCall = (side) => {
    setCall(side)
    sounds.coinFlip()
    setTimeout(() => {
      setStage(STAGES.FLIPPING)
      setTimeout(() => {
        const landed = Math.random() < 0.5 ? 'heads' : 'tails'
        setCoinResult(landed)
        clearInterval(drumRef.current)
        const w = landed === side ? caller : (caller === 1 ? 2 : 1)
        setWinner(w)
        setTimeout(() => setStage(STAGES.RESULT), 600)
      }, 2800)
    }, 200)
  }

  const handleContinue = () => {
    setExiting(true)
    setTossWinner(winner)
    setTimeout(() => setPhase('roundSelect'), 700)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0F',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
      opacity: exiting ? 0 : 1, transition: exiting ? 'opacity 0.7s ease' : 'none',
    }}>

      {/* Corner brackets */}
      {['tl','tr','bl','br'].map(p => <div key={p} className={`corner-bracket corner-bracket--${p}`} />)}

      {/* Confetti */}
      {confetti.map(c => (
        <div key={c.id} style={{
          position: 'absolute',
          left: `${c.x}%`, top: -20,
          width: c.size, height: c.size,
          background: c.color,
          borderRadius: Math.random() > 0.5 ? '50%' : 2,
          animation: `confettiFall ${c.dur}s ${c.delay}s ease-in forwards`,
          transform: `rotate(${c.rotation}deg)`,
          pointerEvents: 'none',
          zIndex: 100,
        }} />
      ))}

      {/* Header pill */}
      <div style={{
        position: 'absolute', top: 32,
        fontSize: 10, fontWeight: 700, letterSpacing: 5,
        color: 'rgba(255,215,0,0.4)', fontFamily: 'Inter,sans-serif',
      }}>QUIZZERIA · THE TOSS</div>

      {/* ── STAGE: SELECT CALLER ── */}
      {stage === STAGES.SELECT_CALLER && (
        <div style={S.card} className="fade-in">
          <div style={S.stageLabel}>Step 1 of 2</div>
          <h1 style={S.title}>Who Calls the Toss?</h1>
          <p style={S.sub}>Select the team that will call Heads or Tails</p>
          <div style={S.teamRow}>
            {[1, 2].map(n => {
              const name  = n === 1 ? teams.team1 : teams.team2
              const color = n === 1 ? GOLD : AMBER
              return (
                <button key={n}
                  style={{
                    ...S.teamCard,
                    borderColor: `${color}30`,
                    background: `linear-gradient(135deg, ${color}08, transparent)`,
                  }}
                  onClick={() => handleSelectCaller(n)}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = color
                    e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)'
                    e.currentTarget.style.boxShadow = `0 20px 48px ${color}22`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${color}30`
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>
                    {n === 1 ? '🟡' : '🟠'}
                  </div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color, lineHeight: 1.2 }}>
                    {name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 2, marginTop: 6, fontFamily: 'Inter,sans-serif' }}>
                    TEAM {n} · CALLS FIRST
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STAGE: CALLING ── */}
      {stage === STAGES.CALLING && (
        <div style={S.card} className="fade-in">
          <div style={S.stageLabel}>Step 2 of 2</div>
          <div style={{ animation: 'callChip 0.5s ease forwards', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 28 }}>{caller === 1 ? '🟡' : '🟠'}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: callerColor }}>
              {callerName}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, fontFamily: 'Inter,sans-serif' }}>
              — CALLING —
            </div>
          </div>
          <h1 style={{ ...S.title, marginTop: 20 }}>Heads or Tails?</h1>
          <p style={S.sub}>Make your call before the flip</p>

          <div style={S.callRow}>
            {['heads', 'tails'].map(side => (
              <button key={side}
                style={{
                  ...S.callBtn,
                  borderColor: call === side ? callerColor : 'rgba(255,255,255,0.08)',
                  background: call === side ? `${callerColor}12` : 'rgba(255,255,255,0.03)',
                  transform: call === side ? 'scale(1.06)' : 'scale(1)',
                  boxShadow: call === side ? `0 0 32px ${callerColor}30` : 'none',
                }}
                onClick={() => handleCall(side)}
                onMouseEnter={e => {
                  if (call !== side) {
                    e.currentTarget.style.borderColor = `${callerColor}55`
                    e.currentTarget.style.transform = 'scale(1.03)'
                  }
                }}
                onMouseLeave={e => {
                  if (call !== side) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}>
                <div style={{ fontSize: 44, marginBottom: 6 }}>
                  {side === 'heads' ? '👑' : '⚜️'}
                </div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 900, color: callerColor, textTransform: 'uppercase', letterSpacing: 3 }}>
                  {side}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STAGE: FLIPPING ── */}
      {stage === STAGES.FLIPPING && (
        <div style={{ ...S.card, gap: 24 }} className="fade-in">
          <div style={{ fontSize: 13, letterSpacing: 5, color: 'rgba(255,215,0,0.4)', fontFamily: 'Inter,sans-serif' }}>
            FLIPPING...
          </div>

          {/* 3D Coin */}
          <div style={{ position: 'relative', width: 140, height: 140, margin: '12px 0' }}>
            {/* Glow */}
            <div style={{
              position: 'absolute', inset: -20,
              background: `radial-gradient(circle, ${GOLD}20 0%, transparent 70%)`,
              animation: 'drumRollPulse 0.16s ease-in-out infinite',
              borderRadius: '50%',
            }} />
            {/* Coin face */}
            <div style={{
              width: 140, height: 140, borderRadius: '50%',
              background: `conic-gradient(from 0deg, #FFD700, #FFA500, #FFD700, #CC8800, #FFD700)`,
              boxShadow: `0 0 40px ${GOLD}60, inset 0 4px 0 rgba(255,255,255,0.4), inset 0 -4px 0 rgba(0,0,0,0.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'coinSpinFast 2.8s cubic-bezier(0.4,0,0.6,1) forwards',
              position: 'relative',
              border: '4px solid #CC8800',
            }}>
              <div style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 52, fontWeight: 900, color: '#8B5000',
                textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                userSelect: 'none',
              }}>₿</div>
            </div>
          </div>

          {/* Drum roll dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[0,1,2,3,4,5,6].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: drumTick % 7 === i ? GOLD : 'rgba(255,215,0,0.15)',
                transition: 'background 0.06s ease',
              }} />
            ))}
          </div>

          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter,sans-serif', letterSpacing: 2 }}>
            {callerName} called <strong style={{ color: callerColor }}>{call?.toUpperCase()}</strong>
          </div>
        </div>
      )}

      {/* ── STAGE: RESULT ── */}
      {stage === STAGES.RESULT && (
        <div style={{ ...S.card, gap: 20 }}>

          {/* Coin settled */}
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: `conic-gradient(from 0deg, #FFD700, #FFA500, #FFD700, #CC8800, #FFD700)`,
            boxShadow: `0 0 60px ${GOLD}80, inset 0 4px 0 rgba(255,255,255,0.4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'coinLand 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards',
            border: '4px solid #CC8800',
          }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#8B5000', fontFamily: "'Playfair Display',serif" }}>
              {coinResult === 'heads' ? '👑' : '⚜️'}
            </div>
          </div>

          {/* It's HEADS / TAILS */}
          <div style={{ textAlign: 'center', animation: 'fadeUp 0.5s ease 0.3s both' }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter,sans-serif', marginBottom: 4 }}>
              IT LANDED ON
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 900, color: GOLD, letterSpacing: 4 }}>
              {coinResult?.toUpperCase()}
            </div>
          </div>

          <div style={{ width: '80%', height: 1, background: 'rgba(255,215,0,0.12)' }} />

          {/* Winner reveal */}
          <div style={{ textAlign: 'center', animation: 'winnerSlam 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.4s both' }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter,sans-serif', marginBottom: 8 }}>
              🎉 TOSS WINNER
            </div>
            <div style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 44, fontWeight: 900, color: winnerColor,
              textShadow: `0 0 40px ${winnerColor}60, 0 0 80px ${winnerColor}25`,
              lineHeight: 1.1,
            }}>
              {winnerName}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 8, fontFamily: 'Inter,sans-serif' }}>
              {call === coinResult
                ? `${callerName} called ${call} — correct!`
                : `${callerName} called ${call === 'heads' ? 'tails' : 'heads'} on ${coinResult}`}
            </div>
          </div>

          <button
            className="btn-gold"
            style={{ marginTop: 8, animation: 'fadeUp 0.6s ease 0.9s both', opacity: 0 }}
            onClick={handleContinue}>
            Continue to Rounds →
          </button>
        </div>
      )}
    </div>
  )
}

const S = {
  card: {
    background: 'rgba(14,14,22,0.97)',
    border: '1px solid rgba(255,215,0,0.12)',
    borderRadius: 28, padding: '48px 52px',
    width: '100%', maxWidth: 560,
    boxShadow: '0 12px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,215,0,0.06)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    position: 'relative',
  },
  stageLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: 4,
    color: 'rgba(255,215,0,0.35)', fontFamily: 'Inter,sans-serif',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: "'Playfair Display',serif",
    fontSize: 30, fontWeight: 900, color: '#F0F0F0',
    textAlign: 'center', lineHeight: 1.2, margin: 0,
  },
  sub: { fontSize: 13, color: '#555', textAlign: 'center', margin: 0, fontFamily: 'Inter,sans-serif' },
  teamRow: { display: 'flex', gap: 16, width: '100%', marginTop: 8 },
  teamCard: {
    flex: 1, border: '1.5px solid', borderRadius: 20, padding: '32px 16px',
    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    backdropFilter: 'blur(20px)', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    outline: 'none',
  },
  callRow: { display: 'flex', gap: 16, width: '100%' },
  callBtn: {
    flex: 1, border: '1.5px solid', borderRadius: 20, padding: '36px 16px',
    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', outline: 'none',
  },
}
