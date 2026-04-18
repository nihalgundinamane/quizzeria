import { useState, useEffect, useRef } from 'react'
import { useGame } from '../context/GameContext'
import ScoreBar from '../components/common/ScoreBar'
import SaveButton from '../components/common/SaveButton'
import { sounds } from '../utils/sounds'

const ROUNDS = [
  { num:1, name:'Category Clash',     sub:'Ten categories · 30Q each',          accent:'#FFD700', available:true  },
  { num:2, name:'The Visual Vault',   sub:'Picture identification round',        accent:'#85B7EB', available:true  },
  { num:3, name:'The Wild Card',      sub:'Smart, funny & confusing',            accent:'#C084FC', available:true  },
  { num:4, name:'Buzzer Battle',      sub:'50 questions · first to buzz wins',   accent:'#F87171', available:true  },
  { num:5, name:'Agni Pariksha',      sub:'20 questions · 10 min per team',      accent:'#FB923C', available:true  },
  { num:6, name:'Pen & Power',        sub:'Offline sheet round · 10 minutes',    accent:'#34D399', available:true  },
  { num:7, name:'Decode Zone',        sub:'Sequence memory & emoji round',       accent:'#38BDF8', available:true  },
  { num:8, name:'The Final Frontier', sub:'Boss questions · 4 minutes each',     accent:'#F59E0B', available:true  },
]

/* ── Shatter canvas for round completion fanfare ─── */
function ShatterCanvas({ active, accent, onDone }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth; canvas.height = window.innerHeight

    // Generate shards — triangles that fly outward
    const cx = canvas.width / 2, cy = canvas.height / 2
    const shards = Array.from({ length: 40 }, (_, i) => {
      const angle = (i / 40) * Math.PI * 2
      const dist = 80 + Math.random() * 180
      return {
        x: cx + Math.cos(angle) * 30,
        y: cy + Math.sin(angle) * 30,
        vx: Math.cos(angle) * (4 + Math.random() * 6),
        vy: Math.sin(angle) * (4 + Math.random() * 6) - 2,
        size: 20 + Math.random() * 50,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.18,
        opacity: 1,
        color: [accent, '#FFD700', '#FFF', '#FFA500'][Math.floor(Math.random() * 4)],
      }
    })

    let frame = 0
    let anim
    const draw = () => {
      frame++
      // Phase 1 (0–30): shatter out
      // Phase 2 (31–60): pause
      // Phase 3 (61–90): rebuild in (fade from black)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (frame <= 60) {
        // Dark flash overlay
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, frame / 20)})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        shards.forEach(s => {
          s.x += s.vx; s.y += s.vy; s.vy += 0.15
          s.rotation += s.rotSpeed
          if (frame > 20) s.opacity -= 0.025
          ctx.save()
          ctx.globalAlpha = Math.max(0, s.opacity)
          ctx.translate(s.x, s.y)
          ctx.rotate(s.rotation)
          ctx.beginPath()
          ctx.moveTo(0, -s.size / 2)
          ctx.lineTo(s.size / 2, s.size / 2)
          ctx.lineTo(-s.size / 2, s.size / 2)
          ctx.closePath()
          ctx.fillStyle = s.color
          ctx.fill()
          ctx.restore()
        })
      } else {
        // Rebuild: fade the overlay out
        const alpha = Math.max(0, 1 - (frame - 60) / 30)
        ctx.fillStyle = `rgba(0,0,0,${alpha})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        if (frame >= 90) { cancelAnimationFrame(anim); onDone?.(); return }
      }
      anim = requestAnimationFrame(draw)
    }
    anim = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(anim)
  }, [active, accent])

  if (!active) return null
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:500, pointerEvents:'none' }} />
}

export default function RoundSelectPage() {
  const { teams, scores, setCurrentRound, setPhase, completedRounds } = useGame()
  const [hovered, setHovered]     = useState(null)
  const [selected, setSelected]   = useState(null)
  const [fanfare, setFanfare]     = useState(null) // { roundNum, accent } when active
  const [pendingNav, setPendingNav] = useState(null) // navigation to fire after fanfare
  const prevCompleted = useRef(new Set())

  // Detect newly completed round → trigger fanfare
  useEffect(() => {
    const newlyDone = [...completedRounds].find(r => !prevCompleted.current.has(r))
    if (newlyDone !== undefined) {
      const round = ROUNDS.find(r => r.num === newlyDone)
      if (round) {
        setFanfare({ roundNum: newlyDone, accent: round.accent })
        sounds.roundComplete()
        // After Round 4, queue halftime after fanfare
        if (newlyDone === 4) setPendingNav('halftime')
      }
    }
    prevCompleted.current = new Set(completedRounds)
  }, [completedRounds])

  const handleFanfareDone = () => {
    setFanfare(null)
    if (pendingNav) { setPhase(pendingNav); setPendingNav(null) }
  }

  const handleSelect = (round) => {
    if (!round.available) return
    setSelected(round.num)
    setTimeout(() => {
      setCurrentRound(round.num)
      setPhase('roundIntro')
    }, 380)
  }

  return (
    <>
      <ScoreBar />
      {/* C3: Shatter fanfare canvas */}
      <ShatterCanvas
        active={!!fanfare}
        accent={fanfare?.accent || '#FFD700'}
        onDone={handleFanfareDone}
      />

      <div style={S.page}>
        {['tl','tr','bl','br'].map(p => <div key={p} className={`corner-bracket corner-bracket--${p}`} />)}
        <div style={S.wrap} className="fade-in">
          <div style={S.header}>
            <div style={S.logoMini}>QUIZZERIA</div>
            <h1 style={S.title}>Select a Round</h1>
            <div className="gold-line" style={{ margin:'12px auto 10px' }} />
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:20,flexWrap:'wrap',marginTop:4}}>
              <p style={{...S.sub,margin:0}}>
                <span style={{color:'#FFD700'}}>{teams.team1}</span>
                <span style={{color:'rgba(255,255,255,0.25)',fontSize:12,margin:'0 10px'}}>{scores.team1} pts</span>
                <span style={{color:'#444'}}>vs</span>
                <span style={{color:'rgba(255,255,255,0.25)',fontSize:12,margin:'0 10px'}}>{scores.team2} pts</span>
                <span style={{color:'#FFA500'}}>{teams.team2}</span>
              </p>
              <SaveButton />
            </div>
          </div>

          <div style={S.grid}>
            {ROUNDS.map((r, i) => {
              const isHov  = hovered === r.num
              const isSel  = selected === r.num
              const isDone = completedRounds.has(r.num)
              const isFanfareRound = fanfare?.roundNum === r.num
              return (
                <div key={r.num}
                  style={{
                    ...S.card,
                    borderColor: !r.available ? 'rgba(255,255,255,0.04)'
                      : isFanfareRound ? r.accent
                      : isDone ? 'rgba(34,197,94,0.35)'
                      : isSel  ? r.accent
                      : isHov  ? `${r.accent}55`
                      : `${r.accent}18`,
                    opacity: !r.available ? 0.3 : isSel ? 0 : 1,
                    transform: isSel ? 'scale(0.9)' : isHov && r.available ? 'translateY(-5px) scale(1.02)' : 'scale(1)',
                    boxShadow: isFanfareRound
                      ? `0 0 40px ${r.accent}40, inset 0 1px 0 rgba(255,255,255,0.08)`
                      : isDone
                        ? '0 0 24px rgba(34,197,94,0.12), inset 0 1px 0 rgba(255,255,255,0.04)'
                        : isHov && r.available
                          ? `0 16px 48px ${r.accent}18, 0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`
                          : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                    cursor: r.available ? 'pointer' : 'not-allowed',
                    animationDelay:`${i*0.045}s`,
                    background: isDone
                      ? 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(255,255,255,0.02) 100%)'
                      : isHov && r.available
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  }}
                  className="fade-in"
                  onClick={() => handleSelect(r)}
                  onMouseEnter={() => r.available && setHovered(r.num)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Completion badge */}
                  {isDone && (
                    <div style={{
                      position:'absolute', top:10, right:10,
                      width:20, height:20, borderRadius:'50%',
                      background:'#22C55E',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:10, color:'#fff', fontWeight:700,
                      animation:'checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
                    }}>✓</div>
                  )}

                  <div style={{...S.roundNum, color: r.available ? (isDone?'#22C55E':r.accent) : '#333'}}>
                    {String(r.num).padStart(2,'0')}
                  </div>
                  <div style={{...S.roundName, color: r.available ? (isDone?'rgba(34,197,94,0.9)':'#F0F0F0') : '#333'}}>
                    {r.name}
                  </div>
                  <div style={{...S.roundSub, color: r.available ? (isDone?'rgba(34,197,94,0.55)':`${r.accent}66`) : '#2a2a2a'}}>
                    {!r.available ? 'Coming soon' : isDone ? 'Completed ✓' : r.sub}
                  </div>
                  {r.available && !isDone && (
                    <div style={{position:'absolute',bottom:0,left:16,right:16,height:1,background:`linear-gradient(90deg,transparent,${r.accent}${isHov?'55':'22'},transparent)`}} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

const S = {
  page:      { minHeight:'100vh', background:'var(--bg-primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px 48px', position:'relative' },
  wrap:      { width:'100%', maxWidth:980, display:'flex', flexDirection:'column', gap:32 },
  header:    { textAlign:'center' },
  logoMini:  { fontFamily:"'Playfair Display',serif", fontSize:11, fontWeight:700, letterSpacing:6, color:'rgba(255,215,0,0.3)', marginBottom:12 },
  title:     { fontFamily:"'Playfair Display',serif", fontSize:40, fontWeight:900, color:'#FFD700', letterSpacing:1 },
  sub:       { fontSize:14, marginTop:8 },
  grid:      { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 },
  card:      { position:'relative', overflow:'hidden', border:'1px solid', borderRadius:18, padding:'26px 20px 24px', display:'flex', flexDirection:'column', gap:8, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', transition:'all 0.32s cubic-bezier(0.34,1.56,0.64,1)' },
  roundNum:  { fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, letterSpacing:3, opacity:0.7 },
  roundName: { fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, lineHeight:1.25 },
  roundSub:  { fontFamily:'Inter,sans-serif', fontSize:11, lineHeight:1.4, marginTop:2 },
}

