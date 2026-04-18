import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'
import { sounds } from '../utils/sounds'

/* ── Animated bar for stat breakdown ─── */
function StatBar({ label, val1, val2, color1='#FFD700', color2='#FFA500' }) {
  const [w1, setW1] = useState(0)
  const [w2, setW2] = useState(0)
  const total = (val1 || 0) + (val2 || 0) || 1

  useEffect(() => {
    const t = setTimeout(() => {
      setW1(Math.round((val1 / total) * 100))
      setW2(Math.round((val2 / total) * 100))
    }, 200)
    return () => clearTimeout(t)
  }, [val1, val2, total])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:'Inter,sans-serif', color:'rgba(255,255,255,0.4)', letterSpacing:1 }}>
        <span style={{ color:color1, fontWeight:700 }}>{val1 ?? 0}</span>
        <span style={{ textTransform:'uppercase', letterSpacing:2 }}>{label}</span>
        <span style={{ color:color2, fontWeight:700 }}>{val2 ?? 0}</span>
      </div>
      <div style={{ display:'flex', height:6, borderRadius:9999, overflow:'hidden', background:'rgba(255,255,255,0.06)' }}>
        <div style={{ width:`${w1}%`, background:`linear-gradient(90deg, ${color1}cc, ${color1}88)`, borderRadius:'9999px 0 0 9999px', transition:'width 1.2s cubic-bezier(0.22,1,0.36,1)' }} />
        <div style={{ width:`${w2}%`, background:`linear-gradient(90deg, ${color2}88, ${color2}cc)`, borderRadius:'0 9999px 9999px 0', marginLeft:'auto', transition:'width 1.2s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>
    </div>
  )
}

/* ── Shooting star particle ─── */
function useStars() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 0.5 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.5,
      twinkle: Math.random() * Math.PI * 2,
    }))
    let anim
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        s.twinkle += 0.03
        const op = s.opacity * (0.6 + 0.4 * Math.sin(s.twinkle))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,215,0,${op})`
        ctx.fill()
      })
      anim = requestAnimationFrame(draw)
    }
    anim = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(anim)
  }, [])
  return canvasRef
}

const CATEGORY_LABELS = {
  gk:'General Knowledge', karnataka:'Karnataka', science:'Science',
  technology:'Technology', sports:'Sports', geography:'Geography',
  history:'History', food_culture:'Food & Culture',
  ramayana:'Ramayana', mahabharata:'Mahabharata',
}

export default function HalftimePage() {
  const { teams, scores, completedCategories, completedRounds, setPhase } = useGame()
  const starsRef = useStars()
  const [visible, setVisible] = useState(false)

  useEffect(() => { setTimeout(() => { setVisible(true); sounds.halftime() }, 100) }, [])

  const t1 = scores.team1
  const t2 = scores.team2
  const leader = t1 > t2 ? teams.team1 : t2 > t1 ? teams.team2 : null
  const leaderColor = t1 >= t2 ? '#FFD700' : '#FFA500'
  const gap = Math.abs(t1 - t2)

  const roundsDone = completedRounds.size
  const catsDone   = completedCategories.size

  return (
    <div style={S.page}>
      {/* Starfield */}
      <canvas ref={starsRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }} />

      <div style={{ ...S.wrap, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition:'all 0.7s cubic-bezier(0.22,1,0.36,1)' }}>

        {/* ── Header ── */}
        <div style={S.header}>
          <div style={S.pill}>⚡ HALFTIME</div>
          <h1 style={S.title}>Mid-Game Report</h1>
          <div style={{ width:80, height:2, background:'linear-gradient(90deg,transparent,#FFD700,transparent)', margin:'10px auto' }} />
          <p style={S.subtitle}>Rounds 1–4 complete · 4 rounds remain</p>
        </div>

        {/* ── Scoreboard card ── */}
        <div style={S.scoreCard} className="glass-card">
          <div style={{ fontSize:11, letterSpacing:3, color:'rgba(255,215,0,0.4)', fontFamily:'Inter,sans-serif', textTransform:'uppercase', marginBottom:16, textAlign:'center' }}>
            Current Standings
          </div>

          {/* Score bars */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:24, marginBottom:20 }}>
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, color:'#FFD700', fontWeight:700, marginBottom:8 }}>{teams.team1}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:900, color:'#FFD700', lineHeight:1, animation:'scorePop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s both', opacity:0 }}>{t1}</div>
              <div style={{ fontSize:10, color:'rgba(255,215,0,0.35)', marginTop:4, fontFamily:'Inter,sans-serif' }}>points</div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ fontSize:24 }}>{t1 === t2 ? '🤝' : t1 > t2 ? '🏆' : '🥈'}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', fontFamily:'Inter,sans-serif' }}>vs</div>
              <div style={{ fontSize:24 }}>{t2 > t1 ? '🏆' : t2 === t1 ? '🤝' : '🥈'}</div>
            </div>

            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, color:'#FFA500', fontWeight:700, marginBottom:8 }}>{teams.team2}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:900, color:'#FFA500', lineHeight:1, animation:'scorePop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.5s both', opacity:0 }}>{t2}</div>
              <div style={{ fontSize:10, color:'rgba(255,165,0,0.35)', marginTop:4, fontFamily:'Inter,sans-serif' }}>points</div>
            </div>
          </div>

          {/* Lead indicator */}
          {leader ? (
            <div style={{ textAlign:'center', padding:'10px 20px', background:`rgba(255,215,0,0.05)`, border:`1px solid rgba(255,215,0,0.12)`, borderRadius:12, fontSize:13, color:'rgba(255,255,255,0.5)', fontFamily:'Inter,sans-serif' }}>
              <span style={{ color:leaderColor, fontWeight:700 }}>{leader}</span>
              {' '}leads by{' '}
              <span style={{ color:leaderColor, fontWeight:700 }}>{gap} pts</span>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'10px 20px', background:'rgba(255,255,255,0.04)', borderRadius:12, fontSize:13, color:'rgba(255,255,255,0.4)', fontFamily:'Inter,sans-serif' }}>
              It's all tied up! ⚡
            </div>
          )}
        </div>

        {/* ── Stat breakdown ── */}
        <div style={S.statsCard} className="glass-card">
          <div style={{ fontSize:11, letterSpacing:3, color:'rgba(255,215,0,0.4)', fontFamily:'Inter,sans-serif', textTransform:'uppercase', marginBottom:16 }}>
            Category Breakdown (Round 01)
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <StatBar label="Rounds Completed" val1={roundsDone} val2={8 - roundsDone} color1="#FFD700" color2="rgba(255,255,255,0.15)" />
            <StatBar label="Categories Done" val1={catsDone} val2={10 - catsDone} color1="#5DCAA5" color2="rgba(255,255,255,0.1)" />
            <StatBar label={`${teams.team1} vs ${teams.team2}`} val1={t1} val2={t2} />
          </div>
        </div>

        {/* ── Motivational line ── */}
        <div style={{ textAlign:'center', animation:'taglineReveal 0.8s ease 0.6s both', opacity:0 }}>
          {t1 === t2
            ? <p style={S.motto}>⚖️ Dead even — the second half decides everything.</p>
            : gap < 50
              ? <p style={S.motto}>🔥 It's razor close — any round could flip this.</p>
              : gap < 150
                ? <p style={S.motto}>💪 A strong lead, but the Final Frontier awaits.</p>
                : <p style={S.motto}>🚀 Dominant so far — can they keep it up?</p>
          }
        </div>

        {/* ── CTA ── */}
        <div style={{ display:'flex', justifyContent:'center', marginTop:8 }}>
          <button
            className="btn-gold"
            style={{ padding:'18px 56px', fontSize:15, letterSpacing:1 }}
            onClick={() => setPhase('roundSelect')}
          >
            Continue to Round 5 →
          </button>
        </div>
      </div>
    </div>
  )
}

const S = {
  page:      { minHeight:'100vh', background:'#0A0A0F', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 24px 48px', position:'relative', overflow:'hidden' },
  wrap:      { width:'100%', maxWidth:620, display:'flex', flexDirection:'column', gap:20, position:'relative', zIndex:1 },
  header:    { textAlign:'center' },
  pill:      { fontSize:10, fontWeight:700, letterSpacing:5, color:'rgba(255,215,0,0.5)', fontFamily:'Inter,sans-serif', textTransform:'uppercase', marginBottom:8 },
  title:     { fontFamily:"'Playfair Display',serif", fontSize:42, fontWeight:900, color:'#FFD700', letterSpacing:1 },
  subtitle:  { fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:'Inter,sans-serif', letterSpacing:1, marginTop:6 },
  scoreCard: { padding:'28px 32px', display:'flex', flexDirection:'column', gap:0 },
  statsCard: { padding:'24px 32px', display:'flex', flexDirection:'column', gap:0 },
  motto:     { fontFamily:"'Playfair Display',serif", fontSize:16, color:'rgba(255,255,255,0.45)', fontStyle:'italic', lineHeight:1.6 },
}
