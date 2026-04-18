import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'
import { sounds } from '../utils/sounds'

/* ── Confetti particle ─────────────────── */
function useConfetti(active) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const particles = useRef([])

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#FFD700','#FFA500','#FF6B6B','#4ECDC4','#A78BFA','#34D399','#F87171','#FBBF24','#60A5FA']
    const shapes = ['circle','square','triangle','ribbon']

    // Spawn 200 particles from top
    for (let i = 0; i < 200; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 5,
        size: 6 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
        gravity: 0.08 + Math.random() * 0.05,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.current = particles.current.filter(p => p.opacity > 0 && p.y < canvas.height + 40)
      particles.current.forEach(p => {
        p.x  += p.vx
        p.y  += p.vy
        p.vy += p.gravity
        p.vx *= 0.99
        p.rotation += p.rotSpeed
        if (p.y > canvas.height * 0.7) p.opacity -= 0.012
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation * Math.PI / 180)
        ctx.fillStyle = p.color
        if (p.shape === 'circle') {
          ctx.beginPath(); ctx.arc(0,0,p.size/2,0,Math.PI*2); ctx.fill()
        } else if (p.shape === 'square') {
          ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size)
        } else if (p.shape === 'triangle') {
          ctx.beginPath(); ctx.moveTo(0,-p.size/2); ctx.lineTo(p.size/2,p.size/2); ctx.lineTo(-p.size/2,p.size/2); ctx.closePath(); ctx.fill()
        } else {
          ctx.fillRect(-p.size/4,-p.size/2,p.size/2,p.size)
        }
        ctx.restore()
      })
      if (particles.current.length > 0) animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animRef.current); particles.current = [] }
  }, [active])

  return canvasRef
}


/* ── Drum roll sound via Web Audio API ──────────────────────── */
function playDrumRoll(durationMs) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const endTime = ctx.currentTime + durationMs / 1000
    let t = ctx.currentTime
    let interval = 0.12  // start slow
    
    while (t < endTime) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      // Low drum-like sound
      osc.frequency.value = 60 + Math.random() * 20
      osc.type = 'sine'
      
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.3, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
      
      osc.start(t)
      osc.stop(t + 0.06)
      
      t += interval
      // Speed up roll as it progresses
      if (interval > 0.04) interval *= 0.97
    }
    
    // Final crash
    const crash = ctx.createOscillator()
    const crashGain = ctx.createGain()
    crash.connect(crashGain); crashGain.connect(ctx.destination)
    crashGain.gain.setValueAtTime(0.5, endTime)
    crashGain.gain.exponentialRampToValueAtTime(0.001, endTime + 0.5)
    crash.frequency.value = 200; crash.type = 'sawtooth'
    crash.start(endTime); crash.stop(endTime + 0.5)
    
    return ctx
  } catch(e) { return null }
}

/* ── Drum roll SVG animation ───────────── */
function DrumRoll({ onDone }) {
  const [frame, setFrame] = useState(0)
  const timers = useRef([])
  const T = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t) }

  useEffect(() => {
    // Play drum roll sound
    const audioCtx = playDrumRoll(4000)
    // Animate drum sticks — alternating positions
    let f = 0
    const interval = setInterval(() => { f++; setFrame(f) }, 80)
    timers.current.push(interval)
    T(() => { clearInterval(interval); onDone() }, 4000)
    return () => { timers.current.forEach(clearTimeout); clearInterval(interval) }
  }, [])

  const stick1Up = frame % 2 === 0
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:32 }}>
      {/* Drum SVG */}
      <svg width="260" height="180" viewBox="0 0 260 180" style={{ filter:'drop-shadow(0 8px 40px rgba(255,215,0,0.25))' }}>
        {/* Drum body */}
        <ellipse cx="130" cy="130" rx="100" ry="35" fill="#1a0a00" stroke="#FFD700" strokeWidth="2"/>
        <rect x="30" y="90" width="200" height="40" fill="#2d1500" stroke="none" rx="4"/>
        <ellipse cx="130" cy="90" rx="100" ry="35" fill="#3d1f00" stroke="#FFD700" strokeWidth="2.5"/>
        {/* Drum head */}
        <ellipse cx="130" cy="88" rx="100" ry="34" fill="#f5d08a" stroke="#FFD700" strokeWidth="2"/>
        <ellipse cx="130" cy="88" rx="90" ry="30" fill="none" stroke="rgba(255,215,0,0.3)" strokeWidth="1"/>
        {/* Tension rods */}
        {[-80,-53,-27,0,27,53,80].map((x,i) => (
          <line key={i} x1={130+x} y1="118" x2={130+x} y2="158" stroke="#FFD700" strokeWidth="2" opacity="0.5"/>
        ))}
        {/* Logo band */}
        <rect x="30" y="105" width="200" height="14" fill="#FFD700" opacity="0.15" rx="2"/>
        {/* Stick 1 */}
        <g transform={`translate(90,${stick1Up?30:50}) rotate(${stick1Up?-35:-20})`}>
          <rect x="-3" y="-60" width="6" height="80" fill="#8B4513" rx="3"/>
          <circle cx="0" cy="-60" r="6" fill="#D2691E"/>
        </g>
        {/* Stick 2 */}
        <g transform={`translate(170,${stick1Up?50:30}) rotate(${stick1Up?20:35})`}>
          <rect x="-3" y="-60" width="6" height="80" fill="#8B4513" rx="3"/>
          <circle cx="0" cy="-60" r="6" fill="#D2691E"/>
        </g>
        {/* Impact ripples when stick hits */}
        {[0.3, 0.6].map((op, i) => (
          <ellipse key={i} cx={stick1Up?90:170} cy="88" rx={20+i*15} ry={7+i*5}
            fill="none" stroke="#FFD700" strokeWidth="1" opacity={op * (frame%3===0?1:0)}/>
        ))}
      </svg>

      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'#FFD700', letterSpacing:2 }}>
          🥁 Drum Roll...
        </div>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,215,0,0.4)', letterSpacing:3, marginTop:8 }}>
          AND THE WINNER IS...
        </div>
      </div>

      {/* Animated dots */}
      <div style={{ display:'flex', gap:8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:10, height:10, borderRadius:'50%', background:'#FFD700',
            opacity: frame % 3 === i ? 1 : 0.2,
            transition:'opacity 0.15s ease',
          }}/>
        ))}
      </div>
    </div>
  )
}

/* ── Main WinnerPage ──────────────────── */
export default function WinnerPage() {
  const { teams, scores, setPhase, resetGame, peakStreaks, completedCategories, completedRounds, answerProgress } = useGame()
  const [phase, setLocalPhase] = useState('drumroll') // drumroll | reveal
  const canvasRef = useConfetti(phase === 'reveal')

  const t1 = scores.team1
  const t2 = scores.team2
  const isTie   = t1 === t2
  const winTeam = t1 > t2 ? 1 : 2
  const winName = winTeam === 1 ? teams.team1 : teams.team2
  const winColor= winTeam === 1 ? '#FFD700' : '#FFA500'
  const loseName= winTeam === 1 ? teams.team2 : teams.team1
  const loseScore = winTeam === 1 ? t2 : t1
  const winScore  = winTeam === 1 ? t1 : t2

  // ── Trophy Room stat calculations ─────────────────────────────
  const catsDone  = completedCategories.size
  const roundsDone = completedRounds.size

  // Questions answered per team from answerProgress
  // Each r01_X key has array of indices answered (alternating teams — simple estimate)
  const totalQ1 = Object.values(answerProgress || {}).reduce((acc, arr) => acc + (Array.isArray(arr) ? Math.ceil(arr.length / 2) : 0), 0)
  const totalQ2 = Object.values(answerProgress || {}).reduce((acc, arr) => acc + (Array.isArray(arr) ? Math.floor(arr.length / 2) : 0), 0)

  const pk1 = peakStreaks?.team1 || 0
  const pk2 = peakStreaks?.team2 || 0
  const longestStreakTeam = pk1 >= pk2 ? teams.team1 : teams.team2
  const longestStreakVal  = Math.max(pk1, pk2)
  const longestStreakColor = pk1 >= pk2 ? '#FFD700' : '#FFA500'

  const scoreDiff = Math.abs(t1 - t2)
  const closenessLabel = scoreDiff === 0 ? 'Dead tie!' : scoreDiff <= 30 ? 'Razor close' : scoreDiff <= 100 ? 'Close contest' : 'Decisive win'

  return (
    <div style={S.page}>
      {/* Confetti canvas */}
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:200 }}/>

      {phase === 'drumroll' ? (
        <DrumRoll onDone={() => { setLocalPhase('reveal'); sounds.victory() }} />
      ) : (
        <div style={{ ...S.revealWrap, maxWidth: 700, width: '100%' }} className="fade-in">
          {/* Glow blob */}
          <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:`radial-gradient(circle, ${winColor}12 0%, transparent 70%)`, pointerEvents:'none' }}/>

          {isTie ? (
            <>
              <div style={S.tieEmoji}>🤝</div>
              <div style={S.tieText}>It's a Tie!</div>
              <div style={S.bothScores}>
                <span style={{color:'#FFD700'}}>{teams.team1}: {t1}</span>
                <span style={{color:'var(--text-muted)'}}>—</span>
                <span style={{color:'#FFA500'}}>{teams.team2}: {t2}</span>
              </div>
            </>
          ) : (
            <>
              {/* Trophy */}
              <div style={{ fontSize:72, animation:'r1BounceUp 0.8s cubic-bezier(0.34,1.56,0.64,1) both', opacity:0 }}>🏆</div>

              {/* Winner name */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, letterSpacing:5, color:'var(--text-secondary)', textTransform:'uppercase' }}>
                  🎉 Winner
                </div>
                <div style={{
                  fontFamily:"'Playfair Display',serif", fontSize:62, fontWeight:900,
                  color: winColor,
                  textShadow:`0 0 60px ${winColor}50, 0 0 120px ${winColor}20`,
                  animation:'r1BounceUp 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.2s both', opacity:0,
                }}>
                  {winName}
                </div>
              </div>

              {/* Score */}
              <div style={S.scoreDisplay} className="glass-card">
                <div style={S.scoreRow}>
                  <span style={{color: winColor, fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700}}>
                    {winName}
                  </span>
                  <span style={{fontFamily:"'Playfair Display',serif", fontSize:44, fontWeight:900, color:winColor}}>
                    {winScore}
                  </span>
                </div>
                <div style={{ width:'100%', height:1, background:'rgba(255,255,255,0.06)' }}/>
                <div style={S.scoreRow}>
                  <span style={{color:'rgba(255,255,255,0.4)', fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700}}>
                    {loseName}
                  </span>
                  <span style={{fontFamily:"'Playfair Display',serif", fontSize:44, fontWeight:900, color:'var(--text-secondary)'}}>
                    {loseScore}
                  </span>
                </div>
              </div>

              {/* ── Trophy Room stats breakdown ── */}
              <div style={{ width:'100%', animation:'taglineReveal 0.7s ease 0.5s both', opacity:0 }}>
                <div style={{ fontSize:10, letterSpacing:4, color:'rgba(255,215,0,0.35)', fontFamily:'Inter,sans-serif', textTransform:'uppercase', textAlign:'center', marginBottom:14 }}>
                  🏅 Game Stats
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {/* Longest streak */}
                  <div style={S.statCard}>
                    <div style={S.statIcon}>🔥</div>
                    <div style={S.statLabel}>Longest Streak</div>
                    <div style={{ ...S.statValue, color: longestStreakColor }}>{longestStreakVal}x</div>
                    <div style={S.statSub}>{longestStreakVal > 0 ? longestStreakTeam : '—'}</div>
                  </div>

                  {/* Closeness */}
                  <div style={S.statCard}>
                    <div style={S.statIcon}>⚖️</div>
                    <div style={S.statLabel}>Contest</div>
                    <div style={{ ...S.statValue, color:'#85B7EB', fontSize:16 }}>{closenessLabel}</div>
                    <div style={S.statSub}>{scoreDiff} pt margin</div>
                  </div>

                  {/* Categories completed */}
                  <div style={S.statCard}>
                    <div style={S.statIcon}>📋</div>
                    <div style={S.statLabel}>Categories Done</div>
                    <div style={{ ...S.statValue, color:'#5DCAA5' }}>{catsDone}/10</div>
                    <div style={S.statSub}>Round 01 coverage</div>
                  </div>

                  {/* Rounds played */}
                  <div style={S.statCard}>
                    <div style={S.statIcon}>🎯</div>
                    <div style={S.statLabel}>Rounds Played</div>
                    <div style={{ ...S.statValue, color:'#C084FC' }}>{roundsDone}/8</div>
                    <div style={S.statSub}>{roundsDone >= 8 ? 'Full game!' : `${8 - roundsDone} remaining`}</div>
                  </div>
                </div>

                {/* Peak score comparison bar */}
                <div style={{ marginTop:12, padding:'16px 20px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14 }}>
                  <div style={{ fontSize:10, letterSpacing:2, color:'rgba(255,255,255,0.25)', fontFamily:'Inter,sans-serif', textTransform:'uppercase', marginBottom:10 }}>Final Score Breakdown</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:12, color:'#FFD700', fontFamily:'Inter,sans-serif', fontWeight:700, minWidth:32, textAlign:'right' }}>{t1}</span>
                    <div style={{ flex:1, height:6, borderRadius:9999, overflow:'hidden', background:'rgba(255,255,255,0.06)', display:'flex' }}>
                      <div style={{ width:`${(t1/(t1+t2||1))*100}%`, background:'linear-gradient(90deg,#FFD700cc,#FFD70088)', borderRadius:'9999px 0 0 9999px', transition:'width 1.4s cubic-bezier(0.22,1,0.36,1)' }} />
                      <div style={{ width:`${(t2/(t1+t2||1))*100}%`, background:'linear-gradient(90deg,#FFA50088,#FFA500cc)', borderRadius:'0 9999px 9999px 0', transition:'width 1.4s cubic-bezier(0.22,1,0.36,1)' }} />
                    </div>
                    <span style={{ fontSize:12, color:'#FFA500', fontFamily:'Inter,sans-serif', fontWeight:700, minWidth:32 }}>{t2}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                    <span style={{ fontSize:10, color:'rgba(255,215,0,0.4)', fontFamily:'Inter,sans-serif' }}>{teams.team1}</span>
                    <span style={{ fontSize:10, color:'rgba(255,165,0,0.4)', fontFamily:'Inter,sans-serif' }}>{teams.team2}</span>
                  </div>
                </div>
              </div>

              {/* Party emojis row */}
              <div style={{ fontSize:28, animation:'taglineReveal 0.7s ease 0.8s both', opacity:0, letterSpacing:6 }}>
                🎊 🎉 🥳 🎊 🎉
              </div>
            </>
          )}

          <div style={{ display:'flex', gap:12, marginTop:16, flexWrap:'wrap', justifyContent:'center' }}>
            <button
              style={{ ...S.secondaryBtn }}
              onClick={() => setPhase('roundSelect')}
            >
              Back to Rounds
            </button>
            <button
              className="btn-gold"
              style={{ padding:'16px 48px' }}
              onClick={resetGame}
            >
              🎮 New Game
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  secondaryBtn: { background:'none', border:'1px solid rgba(255,255,255,0.15)', borderRadius:9999, padding:'16px 32px', fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.45)', cursor:'pointer', letterSpacing:1, transition:'all 0.2s' },
  page: { minHeight:'100vh', background:'var(--bg-primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, position:'relative', overflow:'hidden' },
  revealWrap: { display:'flex', flexDirection:'column', alignItems:'center', gap:20, textAlign:'center', position:'relative', zIndex:10 },
  tieEmoji: { fontSize:72 },
  tieText:  { fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:900, color:'#FFD700', letterSpacing:2 },
  bothScores:{ display:'flex', gap:20, fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, alignItems:'center' },
  scoreDisplay: { padding:'24px 40px', display:'flex', flexDirection:'column', gap:16, minWidth:320 },
  scoreRow: { display:'flex', justifyContent:'space-between', alignItems:'center', gap:32 },
  statCard: { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px', display:'flex', flexDirection:'column', alignItems:'center', gap:4 },
  statIcon: { fontSize:22, lineHeight:1, marginBottom:2 },
  statLabel: { fontSize:10, letterSpacing:2, color:'rgba(255,255,255,0.3)', fontFamily:'Inter,sans-serif', textTransform:'uppercase' },
  statValue: { fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, lineHeight:1 },
  statSub:  { fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:'Inter,sans-serif', marginTop:2 },
}
