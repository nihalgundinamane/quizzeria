import { useEffect, useRef, useState, useCallback } from 'react'
import { useGame } from '../context/GameContext'
import { sounds } from '../utils/sounds'

const WORD = 'QUIZZERIA'
const Q_POS = [
  {x:8,y:7},{x:30,y:13},{x:56,y:5},{x:76,y:17},{x:91,y:7},
  {x:15,y:37},{x:73,y:35},{x:5,y:60},{x:93,y:54},{x:47,y:4},
  {x:21,y:77},{x:61,y:81},{x:83,y:73},{x:37,y:87},{x:4,y:84},
  {x:49,y:91},{x:87,y:87},{x:13,y:51},{x:84,y:27},{x:43,y:69},
  {x:69,y:59},{x:27,y:29},{x:54,y:47},{x:7,y:21},{x:94,y:37},
]

export default function LandingPage() {
  const { setPhase, hasSavedGame, loadSavedGame, resetGame } = useGame()
  const seeds = useRef(Q_POS.map(() => Math.random())).current

  const [particles, setParticles]   = useState(() =>
    Q_POS.map((p, i) => ({ ...p, id: i, opacity: 0 }))
  )
  const [showRings,   setShowRings]   = useState(false)
  const [showLogo,    setShowLogo]    = useState(false)
  const [lettersDone, setLettersDone] = useState(new Set())
  const [allIn,       setAllIn]       = useState(false)
  const [dancing,     setDancing]     = useState(false)
  const [showButtons, setShowButtons] = useState(false)
  const [exiting,     setExiting]     = useState(false)
  const timers = useRef([])
  const T = useCallback((fn, ms) => {
    const t = setTimeout(fn, ms); timers.current.push(t)
  }, [])

  // Check saved game once
  const savedGame = (() => {
    try {
      const raw = localStorage.getItem('qz-save')
      if (!raw) return null
      const s = JSON.parse(raw)
      return s
    } catch { return null }
  })()

  useEffect(() => {
    Q_POS.forEach((_, i) =>
      T(() => setParticles(prev => prev.map(p =>
        p.id === i ? { ...p, opacity: 0.15 + seeds[i] * 0.45 } : p
      )), 60 + i * 64)
    )
    T(() => setShowRings(true), 2400)
    T(() => {
      setShowLogo(true)
      WORD.split('').forEach((_, i) =>
        T(() => setLettersDone(s => new Set([...s, i])), i * 100)
      )
    }, 3600)
    T(() => setAllIn(true), 3600 + WORD.length * 100 + 400)
    T(() => { setDancing(true); sounds.fanfare() },  3600 + WORD.length * 100 + 700)
    T(() => setDancing(false), 3600 + WORD.length * 100 + 2000)
    T(() => setShowButtons(true), 3600 + WORD.length * 100 + 2300)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  const goNew = () => {
    setExiting(true)
    setTimeout(() => { resetGame(); setPhase('teamEntry') }, 550)
  }

  const goContinue = () => {
    setExiting(true)
    setTimeout(() => loadSavedGame(), 550)
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#0A0A0F',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      overflow:'hidden', position:'relative',
      opacity: exiting ? 0 : 1, transition: exiting ? 'opacity 0.55s ease' : 'none',
    }}>
      {/* Ambient dots */}
      {seeds.map((s, i) => (
        <div key={i} style={{
          position:'absolute', borderRadius:'50%', background:'#FFD700',
          width:`${1+s*1.5}px`, height:`${1+s*1.5}px`,
          left:`${(s*97+i*3.7)%100}%`, top:`${(s*97+i*7.3)%100}%`,
          opacity:0.04+s*0.12, pointerEvents:'none',
          animation:`starPulse ${1.4+s*1.6}s ease-in-out infinite alternate`,
          animationDelay:`${s*2}s`,
        }} />
      ))}

      {/* ? particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position:'absolute', pointerEvents:'none',
          fontFamily:'Georgia,serif', fontWeight:700, lineHeight:1, userSelect:'none',
          left:`${p.x}%`, top:`${p.y}%`,
          fontSize:`${13 + seeds[p.id] * 20}px`, color:'#FFD700',
          opacity:p.opacity, transition:'opacity 1.2s ease',
        }}>?</div>
      ))}

      {/* Rings */}
      {showRings && [
        {w:420,op:'rgba(255,215,0,0.14)',d:'0s'},
        {w:300,op:'rgba(255,165,0,0.10)',d:'0.5s'},
        {w:190,op:'rgba(255,215,0,0.07)',d:'1s'},
      ].map((r,i) => (
        <div key={i} style={{
          position:'absolute', borderRadius:'50%', width:r.w, height:r.w,
          border:`1px solid ${r.op}`, pointerEvents:'none',
          animation:`ringPop 0.8s ease forwards, ringBreath 3.2s ease-in-out ${r.d} infinite`,
        }} />
      ))}

      {/* Corner brackets */}
      {['tl','tr','bl','br'].map(p => <div key={p} className={`corner-bracket corner-bracket--${p}`} />)}

      {/* Logo */}
      {showLogo && (
        <div style={{ position:'relative', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,165,0,0.45))', animation:'lineExpand 1s ease forwards' }} />
            <div style={{ display:'flex', willChange:'transform' }}>
              {WORD.split('').map((ch, i) => {
                const visible = lettersDone.has(i)
                const dy = dancing ? (i%2===0 ? -10 : 9) : 0
                const dr = dancing ? (i%2===0 ? -3 : 2.5) : 0
                return (
                  <span key={i} style={{
                    fontFamily:"'Playfair Display',Georgia,serif",
                    fontSize:66, fontWeight:900, color:'#FFD700',
                    textShadow:'3px 3px 0 #5c3d00, 6px 6px 0 #3d2800',
                    display:'inline-block', letterSpacing:5, lineHeight:1, willChange:'transform',
                    opacity: visible ? 1 : 0,
                    transform: !visible ? 'translateY(60px) scale(0.6)'
                      : allIn && dancing ? `translateY(${dy}px) rotate(${dr}deg)`
                      : 'translateY(0) rotate(0deg) scale(1)',
                    transition: !visible ? 'none'
                      : allIn && dancing ? `transform ${0.7+i*0.04}s cubic-bezier(0.34,1.56,0.64,1)`
                      : allIn ? `transform 0.55s cubic-bezier(0.34,1.56,0.64,1) ${i*0.03}s, opacity 0.5s ease`
                      : `opacity 0.5s ease ${i*0.05}s`,
                  }}>{ch}</span>
                )
              })}
            </div>
            <div style={{ width:0, height:1, background:'linear-gradient(90deg,rgba(255,165,0,0.45),transparent)', animation:'lineExpand 1s ease forwards' }} />
          </div>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, letterSpacing:8, color:'#FFA500', opacity:0, animation:'taglineReveal 0.9s ease 0.5s forwards' }}>
            THE ULTIMATE QUIZ EXPERIENCE
          </div>
        </div>
      )}

      {/* Action buttons */}
      {showButtons && (
        <div style={{ marginTop:52, display:'flex', flexDirection:'column', alignItems:'center', gap:14, opacity:0, animation:'fadeUp 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.1s forwards' }}>

          {/* If saved game exists — show Continue prominently */}
          {savedGame && (
            <>
              <button
                style={{
                  background:'linear-gradient(145deg,#1a1f35,#12121F)',
                  border:'1.5px solid rgba(255,215,0,0.55)',
                  borderRadius:'9999px', padding:'18px 56px', cursor:'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                  transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  boxShadow:'0 8px 32px rgba(255,215,0,0.2), inset 0 1px 0 rgba(255,215,0,0.08)',
                }}
                onClick={goContinue}
                onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.05)';e.currentTarget.style.boxShadow='0 14px 48px rgba(255,215,0,0.4)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 8px 32px rgba(255,215,0,0.2)'}}
              >
                <span style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:18, fontWeight:700, letterSpacing:4, color:'#FFD700', lineHeight:1 }}>
                  ▶ CONTINUE GAME
                </span>
                <span style={{ fontFamily:'Inter,sans-serif', fontSize:10, letterSpacing:2, color:'rgba(255,165,0,0.6)' }}>
                  {savedGame.teams?.team1} vs {savedGame.teams?.team2} · saved {new Date(savedGame.savedAt).toLocaleDateString()}
                </span>
              </button>

              <div style={{ display:'flex', alignItems:'center', gap:12, width:'100%' }}>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
                <span style={{ fontSize:10, letterSpacing:2, color:'rgba(255,255,255,0.2)', fontFamily:'Inter,sans-serif' }}>OR</span>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
              </div>
            </>
          )}

          {/* New Game button */}
          <button
            style={{
              background: savedGame ? 'none' : 'linear-gradient(145deg,#1e1e35,#12121F)',
              border: savedGame ? '1px solid rgba(255,255,255,0.12)' : '1.5px solid rgba(255,215,0,0.5)',
              borderRadius:'9999px',
              padding: savedGame ? '14px 44px' : '18px 52px',
              cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={goNew}
            onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.05)';e.currentTarget.style.borderColor=savedGame?'rgba(255,255,255,0.25)':'rgba(255,215,0,0.75)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.borderColor=savedGame?'rgba(255,255,255,0.12)':'rgba(255,215,0,0.5)'}}
          >
            <span style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize: savedGame?15:18, fontWeight:700, letterSpacing: savedGame?3:6, color: savedGame?'rgba(255,255,255,0.5)':'#FFD700', lineHeight:1 }}>
              {savedGame ? '+ NEW GAME' : 'ENTER'}
            </span>
            {!savedGame && <span style={{ fontFamily:'Inter,sans-serif', fontSize:10, letterSpacing:2, color:'rgba(255,165,0,0.7)' }}>Begin the Journey</span>}
          </button>
        </div>
      )}
    </div>
  )
}
