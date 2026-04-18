import { useState, useEffect, useRef } from 'react'
import { useGame } from '../context/GameContext'
import ScoreBar from '../components/common/ScoreBar'
import SaveButton from '../components/common/SaveButton'
import { sounds } from '../utils/sounds'

const TOTAL_TIME = 10 * 60

export default function Round06PlayPage() {
  const { teams, addScore, setPhase, markRoundDone, markAnswered } = useGame()
  const [started, setStarted]         = useState(false)
  const [timeLeft, setTimeLeft]       = useState(TOTAL_TIME)
  const [running, setRunning]         = useState(false)
  const [done, setDone]               = useState(false)
  const [t1Score, setT1Score]         = useState('')
  const [t2Score, setT2Score]         = useState('')
  const [submitted, setSubmitted]     = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setRunning(false); setDone(true); sounds.timerEnd(); return 0 }
        if (t <= 60) sounds.tick()
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [running])

  const mins   = String(Math.floor(timeLeft / 60)).padStart(2,'0')
  const secs   = String(timeLeft % 60).padStart(2,'0')
  const pct    = timeLeft / TOTAL_TIME
  const danger = timeLeft <= 60

  // BIG clock: radius 110 for 2x size
  const R    = 110
  const circ = 2 * Math.PI * R
  const size = 300

  const parseScore = (v) => {
    const n = parseInt(v, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }

  const handleScoreSubmit = () => {
    addScore(1, parseScore(t1Score))
    addScore(2, parseScore(t2Score))
    setSubmitted(true)
    sounds.score()
    if(markAnswered) markAnswered('r06', 0)
  }

  if (!started) return (
    <>
      <ScoreBar />
      <div style={S.page}>
        {['tl','tr','bl','br'].map(p => <div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:'#34D399'}} />)}
        <div style={S.card} className="glass-card fade-in">
          <div style={S.badge}>ROUND 06 · PEN & POWER</div>
          <h1 style={{fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:900, color:'#34D399'}}>Offline Round</h1>
          <div className="gold-line" style={{margin:'16px auto 20px'}} />
          <p style={S.sub}>Distribute question sheets to both teams.</p>
          <p style={{...S.sub, marginTop:4}}>
            They have <strong style={{color:'#34D399', fontSize:16}}>10 minutes</strong> to answer everything.
          </p>
          <p style={{...S.sub, fontSize:12, color:'var(--text-muted)', marginTop:8}}>Start the timer once both teams have their sheets.</p>
          <button className="btn-gold" style={{marginTop:28, borderColor:'rgba(52,211,153,0.5)', color:'#34D399', padding:'16px 48px'}}
            onClick={() => { setStarted(true); setRunning(true) }}>
            Start Timer
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <ScoreBar />
      <div style={S.page}>
        {['tl','tr','bl','br'].map(p => <div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:'#34D399'}} />)}

        <div style={{fontFamily:'Inter,sans-serif', fontSize:11, letterSpacing:5, color:'rgba(52,211,153,0.45)', textTransform:'uppercase', marginBottom:4}}>
          PEN & POWER · TIMER
        </div>

        {/* 2× Big circular clock */}
        <div style={{position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:size, height:size}}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{position:'absolute', inset:0}}>
            {/* Track */}
            <circle cx={size/2} cy={size/2} r={R} fill="none"
              stroke="rgba(52,211,153,0.07)" strokeWidth="8"/>
            {/* Progress */}
            <circle cx={size/2} cy={size/2} r={R} fill="none"
              stroke={danger ? '#EF4444' : '#34D399'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${pct * circ} ${circ}`}
              strokeDashoffset={circ * 0.25}
              transform={`rotate(-90 ${size/2} ${size/2})`}
              style={{transition:'stroke-dasharray 1s linear, stroke 0.5s ease'}}
            />
          </svg>
          {/* Glass disc */}
          <div style={{
            width: R*2 - 24, height: R*2 - 24, borderRadius:'50%',
            background:'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
            backdropFilter:'blur(24px)',
            border:'1px solid rgba(255,255,255,0.1)',
            boxShadow:'inset 0 1px 0 rgba(255,255,255,0.08)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          }}>
            <div style={{
              fontFamily:"'Playfair Display',serif",
              fontSize: 64, fontWeight:900, lineHeight:1,
              color: danger ? '#EF4444' : '#34D399',
              animation: danger ? 'timerDanger 0.8s ease-in-out infinite' : 'none',
              transition:'color 0.4s ease',
            }}>
              {mins}:{secs}
            </div>
            <div style={{fontSize:12, letterSpacing:3, color:'var(--text-muted)', marginTop:4}}>remaining</div>
          </div>
        </div>

        {/* Controls */}
        {!done ? (
          <div style={{display:'flex', gap:12, marginTop:8}}>
            <button style={S.ctrlBtn} onClick={() => setRunning(r=>!r)}>
              {running ? '⏸  Pause' : '▶  Resume'}
            </button>
            <button style={{...S.ctrlBtn, color:'#EF4444', borderColor:'rgba(239,68,68,0.3)'}}
              onClick={() => { setRunning(false); clearInterval(timerRef.current); setDone(true) }}>
              End Early
            </button>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:20}} className="fade-in">
            <div style={{fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:'#EF4444'}}>
              ⏰ Time's up! Collect all sheets now.
            </div>

            {!submitted ? (
              <div style={S.scoreEntry} className="glass-card">
                <div style={{fontSize:11, letterSpacing:3, color:'rgba(52,211,153,0.6)', textTransform:'uppercase', marginBottom:20}}>
                  Enter Final Sheet Scores
                </div>
                <div style={{display:'flex', gap:20, alignItems:'flex-end'}}>
                  <div style={{display:'flex', flexDirection:'column', gap:8, flex:1}}>
                    <label style={{fontSize:11, color:'#FFD700', letterSpacing:2}}>{teams.team1}</label>
                    <input type="number" min="0" placeholder="0"
                      value={t1Score} onChange={e=>setT1Score(e.target.value)}
                      style={S.numInput}
                    />
                  </div>
                  <div style={{fontSize:20, color:'rgba(255,255,255,0.2)', paddingBottom:12}}>vs</div>
                  <div style={{display:'flex', flexDirection:'column', gap:8, flex:1}}>
                    <label style={{fontSize:11, color:'#FFA500', letterSpacing:2}}>{teams.team2}</label>
                    <input type="number" min="0" placeholder="0"
                      value={t2Score} onChange={e=>setT2Score(e.target.value)}
                      style={S.numInput}
                    />
                  </div>
                </div>
                <button className="btn-gold" style={{marginTop:20, borderColor:'rgba(52,211,153,0.45)', color:'#34D399', padding:'14px 40px', fontSize:14}}
                  onClick={handleScoreSubmit}>
                  Confirm Scores
                </button>
              </div>
            ) : (
              <div style={{fontSize:15, color:'#34D399', fontFamily:"'Playfair Display',serif"}}>✓ Scores recorded!</div>
            )}

            <button className="btn-gold" style={{
                borderColor:'rgba(52,211,153,0.45)', color:'#34D399',
                opacity: 1,
                cursor: 'pointer',
              }}
              onClick={() => { markRoundDone(6); setPhase('roundSelect') }}>
              {submitted ? 'Continue →' : 'Skip & Continue →'}
            </button>
            <SaveButton />
          </div>
        )}
      </div>
    </>
  )
}

const S = {
  page:    { minHeight:'100vh', background:'var(--bg-primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px 40px', gap:24, position:'relative' },
  card:    { width:'100%', maxWidth:480, padding:'48px 52px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 },
  badge:   { fontSize:11, fontWeight:600, letterSpacing:4, color:'#34D399', border:'1px solid rgba(52,211,153,0.3)', borderRadius:9999, padding:'6px 20px', fontFamily:'Inter,sans-serif' },
  sub:     { fontSize:14, color:'var(--text-secondary)', textAlign:'center', lineHeight:1.7 },
  ctrlBtn: { background:'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))', backdropFilter:'blur(20px)', border:'1.5px solid rgba(52,211,153,0.3)', borderRadius:14, padding:'12px 28px', fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:'#34D399', cursor:'pointer', transition:'all 0.25s ease', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)' },
  scoreEntry: { width:'100%', maxWidth:400, padding:'28px 32px', display:'flex', flexDirection:'column', alignItems:'center' },
  numInput: { background:'rgba(255,255,255,0.05)', backdropFilter:'blur(16px)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:12, padding:'12px 16px', fontSize:28, fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--text-primary)', outline:'none', width:'100%', textAlign:'center', transition:'border-color 0.2s ease', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)' },
}
