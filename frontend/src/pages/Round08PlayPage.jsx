import { useState, useEffect, useRef, useCallback } from 'react'
import { useGame } from '../context/GameContext'
import ScoreBar from '../components/common/ScoreBar'
import SaveButton from '../components/common/SaveButton'
import { api } from '../services/api'
import { sounds } from '../utils/sounds'

const Q_TIME = 4 * 60

export default function Round08PlayPage() {
  const { teams, addScore, tossWinner, setPhase, markRoundDone, markAnswered } = useGame()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [qIdx, setQIdx]           = useState(0)
  const [roundDone, setRoundDone] = useState(false)

  const firstTeam  = tossWinner || 1
  const secondTeam = firstTeam === 1 ? 2 : 1
  const teamForQ   = (i) => i === 0 ? firstTeam : secondTeam

  useEffect(() => {
    api.getR08Questions()
      .then(d => { setQuestions(d.questions); setLoading(false) })
      .catch(e => { setError(e.message || 'Failed to load'); setLoading(false) })
  }, [])

  if (loading) return <Status msg="Loading Boss Questions…" />
  if (error)   return <Status msg={`${error} — is the backend running?`} />

  if (roundDone) return (
    <>
      <ScoreBar />
      <div style={S.page}>
        {['tl','tr','bl','br'].map(p => <div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:'#F59E0B'}} />)}
        <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:24}} className="fade-in">
          <div style={{fontSize:56}}>🏆</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,letterSpacing:5,color:'rgba(245,158,11,0.6)'}}>ROUND 08 COMPLETE</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:44,fontWeight:900,color:'#F59E0B'}}>The Final Frontier</div>
          <div style={{fontSize:14,color:'var(--text-secondary)',maxWidth:380,textAlign:'center',lineHeight:1.7}}>
            Both boss questions complete. The final verdict awaits.
          </div>
          <div style={{display:'flex',gap:12,marginTop:8}}>
            <button style={S.backBtn} onClick={() => setPhase('roundSelect')}>← Back to Rounds</button>
            <button className="btn-gold" style={{borderColor:'rgba(245,158,11,0.5)',color:'#F59E0B',fontSize:14,letterSpacing:3,padding:'16px 40px'}}
              onClick={() => { markRoundDone(8); setPhase('winner') }}>
              🥁 Reveal Winner
            </button>
            <SaveButton />
          </div>
        </div>
      </div>
    </>
  )

  const q = questions[qIdx]
  if (!q) return null

  const currentTeam = teamForQ(qIdx)
  const teamName    = currentTeam === 1 ? teams.team1 : teams.team2
  const teamColor   = currentTeam === 1 ? '#FFD700' : '#FFA500'

  return (
    <BossQuestion
      key={qIdx}
      q={q}
      qIdx={qIdx}
      totalQ={questions.length}
      teamName={teamName}
      teamColor={teamColor}
      teamN={currentTeam}
      addScore={addScore}
      onBack={() => setPhase('roundSelect')}
      onNext={() => {
        if (qIdx + 1 >= questions.length) setRoundDone(true)
        else setQIdx(i => i + 1)
      }}
    />
  )
}

function BossQuestion({ q, qIdx, totalQ, teamName, teamColor, teamN, addScore, onBack, onNext, markAnswered }) {
  const [timeLeft,  setTimeLeft]  = useState(Q_TIME)
  const [running,   setRunning]   = useState(false)
  const [started,   setStarted]   = useState(false)
  const [selected,  setSelected]  = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [correct,   setCorrect]   = useState(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintIdx,   setHintIdx]   = useState(-1)
  const [timesUp,   setTimesUp]   = useState(false)
  const [optShown,  setOptShown]  = useState(false)   // ← show options toggle
  const timerRef = useRef(null)

  // Use correct field names from API
  const opts     = q.options_en || []
  const opts_kn  = q.options_kn || []
  const hints_en = q.hints_en   || []
  const hints_kn = q.hints_kn   || []
  const totalHints = hints_en.length

  // +100 -10 per hint, min 0
  const calcScore = () => Math.max(0, 100 - hintsUsed * 10)

  const stopTimer = useCallback(() => { clearInterval(timerRef.current); setRunning(false) }, [])

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { stopTimer(); setTimesUp(true); sounds.timerEnd(); return 0 }
        if (t <= 30) sounds.tick()
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [running, stopTimer])

  const handleStart = () => { setStarted(true); setRunning(true) }

  const handleSubmit = () => {
    if (selected === null) return
    stopTimer()
    const isCorrect = selected === q.answer
    setSubmitted(true); setCorrect(isCorrect)
    if (isCorrect) { addScore(teamN, calcScore()); if(markAnswered) markAnswered('r08', qIdx); sounds.correct() }
    else sounds.wrong()
  }

  const handleNextHint = () => {
    if (hintIdx + 1 < totalHints) {
      setHintIdx(i => i + 1)
      setHintsUsed(n => n + 1)
    }
  }

  const mins   = String(Math.floor(timeLeft/60)).padStart(2,'0')
  const secs   = String(timeLeft%60).padStart(2,'0')
  const danger = timeLeft <= 60
  const pct    = timeLeft / Q_TIME
  const R = 60, circ = 2*Math.PI*R

  // ── START SCREEN ──────────────────────────────────────────────
  if (!started) return (
    <>
      <ScoreBar />
      <div style={S.page}>
        {['tl','tr','bl','br'].map(p => <div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:'#F59E0B'}} />)}
        <div style={S.startCard} className="glass-card fade-in">
          <div style={S.bossLabel}>🔥 BOSS QUESTION {qIdx+1} of {totalQ}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,color:teamColor,textAlign:'center'}}>{teamName}</div>
          <div className="gold-line" style={{margin:'12px auto'}} />
          {/* Scoring rules */}
          <div style={S.rulesBox}>
            <div style={S.rulesTitle}>Scoring</div>
            <div style={S.rulesRow}><span>Correct — no hints</span><span style={{color:'#22C55E'}}>+100 pts</span></div>
            <div style={S.rulesRow}><span>Each hint used</span><span style={{color:'#EF4444'}}>−10 pts</span></div>
            <div style={S.rulesRow}><span>3 hints + correct</span><span style={{color:'#FFA500'}}>+70 pts</span></div>
            <div style={S.rulesRow}><span>Wrong answer</span><span style={{color:'var(--text-muted)'}}>0 pts</span></div>
            <div style={S.rulesRow}><span>Time available</span><span style={{color:'#F59E0B'}}>4 minutes</span></div>
          </div>
          <div style={{display:'flex',gap:12,marginTop:4}}>
            <button style={S.backBtn} onClick={onBack}>← Back</button>
            <button className="btn-gold" style={{borderColor:'rgba(245,158,11,0.5)',color:'#F59E0B'}} onClick={handleStart}>
              Reveal Question
            </button>
          </div>
        </div>
      </div>
    </>
  )

  // ── PLAY SCREEN ───────────────────────────────────────────────
  return (
    <>
      <ScoreBar />
      <div style={S.page}>
        {['tl','tr','bl','br'].map(p => <div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:'#F59E0B'}} />)}

        {/* Header: team | score preview | timer */}
        <div style={S.header}>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <button style={S.backBtn} onClick={onBack}>← Rounds</button>
            <div style={{fontFamily:'Inter,sans-serif',fontSize:12,fontWeight:700,letterSpacing:3,color:'rgba(245,158,11,0.6)'}}>
              🔥 BOSS Q{qIdx+1} · <span style={{color:teamColor}}>{teamName}</span>
            </div>
          </div>

          {/* Live score preview */}
          <div style={S.scorePrev}>
            <span style={{fontSize:11,color:'var(--text-muted)',letterSpacing:1}}>If correct now:</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:'#22C55E'}}>+{calcScore()}</span>
            {hintsUsed>0&&<span style={{fontSize:11,color:'rgba(239,68,68,0.6)'}}>({hintsUsed} hint{hintsUsed>1?'s':''} used · −{hintsUsed*10} pts)</span>}
          </div>

          {/* Circular timer */}
          <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="142" height="142" viewBox="0 0 142 142">
              <circle cx="71" cy="71" r={R} fill="none" stroke="rgba(245,158,11,0.08)" strokeWidth="5"/>
              <circle cx="71" cy="71" r={R} fill="none"
                stroke={danger?'#EF4444':'#F59E0B'} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${pct*circ} ${circ}`} strokeDashoffset={circ*0.25}
                transform="rotate(-90 71 71)"
                style={{transition:'stroke-dasharray 1s linear,stroke 0.4s ease'}}
              />
            </svg>
            <div style={{position:'absolute',display:'flex',flexDirection:'column',alignItems:'center'}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:danger?'#EF4444':'#F59E0B',lineHeight:1,animation:danger?'timerDanger 0.8s ease-in-out infinite':'none'}}>
                {mins}:{secs}
              </div>
              <div style={{fontSize:8,letterSpacing:2,color:'var(--text-muted)'}}>LEFT</div>
            </div>
          </div>
        </div>

        {/* Question card */}
        <div style={S.qCard} className="glass-card">
          {/* Question — EN always, KN always below */}
          <div style={S.qEn}>{q.question_en || q.question}</div>
          {(q.question_kn) && <div style={S.qKn}>{q.question_kn}</div>}

          {/* Options — shown only after "Show Options" clicked */}
          {optShown && opts.length > 0 && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {opts.map((opt,i) => {
                const kn = opts_kn[i] || ''
                let bg='rgba(255,255,255,0.04)', border='rgba(255,255,255,0.09)'
                if (submitted) {
                  if (i===q.answer)               { bg='rgba(34,197,94,0.12)'; border='rgba(34,197,94,0.6)' }
                  else if (i===selected&&!correct) { bg='rgba(239,68,68,0.12)'; border='rgba(239,68,68,0.6)' }
                } else if (i===selected)           { bg=`${teamColor}15`; border=teamColor }
                return (
                  <button key={i}
                    style={{
                      background:bg, backdropFilter:'blur(16px)',
                      border:`1px solid ${border}`, borderRadius:14,
                      padding:'14px 18px', display:'flex', alignItems:'flex-start',
                      gap:14, textAlign:'left',
                      transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                      boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)',
                      cursor:submitted?'default':'pointer',
                      animation:'optionSlideIn 0.35s ease forwards',
                      animationDelay:`${i*0.07}s`, opacity:0, animationFillMode:'forwards',
                    }}
                    onClick={()=>{ if(!submitted) setSelected(i) }}
                    onMouseEnter={e=>{ if(!submitted&&i!==selected){ e.currentTarget.style.borderColor=teamColor; e.currentTarget.style.transform='translateX(4px)' }}}
                    onMouseLeave={e=>{ if(!submitted&&i!==selected){ e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'; e.currentTarget.style.transform='translateX(0)' }}}
                  >
                    <span style={S.optLetter}>{['A','B','C','D'][i]}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,color:'var(--text-primary)',lineHeight:1.4}}>{opt}</div>
                      {kn && <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:3,lineHeight:1.4}}>{kn}</div>}
                    </div>
                    {submitted&&i===q.answer           && <span style={{color:'#22C55E',fontSize:16,animation:'scorePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>✓</span>}
                    {submitted&&i===selected&&!correct && <span style={{color:'#EF4444',fontSize:16}}>✕</span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* Hints revealed so far */}
          {hints_en.slice(0, hintIdx+1).map((h,i) => (
            <div key={i} style={S.hintCard} className="fade-in">
              <div style={{fontSize:10,letterSpacing:2,color:'rgba(239,159,39,0.5)',textTransform:'uppercase',marginBottom:4}}>
                Hint {i+1} <span style={{color:'rgba(239,68,68,0.6)',marginLeft:8}}>−10 pts</span>
              </div>
              <div style={{fontSize:14,color:'rgba(239,159,39,0.9)',lineHeight:1.6}}>{h}</div>
              {hints_kn[i]&&<div style={{fontSize:12,color:'rgba(239,159,39,0.55)',marginTop:4}}>{hints_kn[i]}</div>}
            </div>
          ))}

          {/* Result banner */}
          {submitted && (
            <div style={{...S.resultBanner,borderColor:correct?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)',background:correct?'rgba(34,197,94,0.07)':'rgba(239,68,68,0.07)'}} className="scale-in">
              {correct
                ? <>✓ Correct! <strong style={{color:'#22C55E'}}>+{calcScore()} points</strong> for {teamName}</>
                : <>✕ Wrong. Answer: <strong style={{color:'#22C55E'}}>{opts[q.answer]}</strong> — 0 points</>
              }
            </div>
          )}

          {timesUp && !submitted && (
            <div style={{...S.resultBanner,borderColor:'rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.07)'}}>
              ⏰ Time's up! Answer: <strong style={{color:'#22C55E'}}>{opts[q.answer]}</strong>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={S.actions}>
          {/* Show Options */}
          {!optShown && !submitted && !timesUp && (
            <ABtn color="#F59E0B" label="Show Options" sub="Reveal all 4 choices" onClick={() => setOptShown(true)}/>
          )}

          {/* Hints */}
          {!submitted && !timesUp && hintIdx+1 < totalHints && (
            <ABtn color="#EF9F27"
              label={hintIdx<0 ? 'Use Hint 1' : `Use Hint ${hintIdx+2}`}
              sub={`−10 pts · ${totalHints-hintIdx-1} remaining`}
              onClick={handleNextHint}
            />
          )}

          {/* Submit — only when options shown and one selected */}
          {optShown && !submitted && !timesUp && (
            <ABtn color="#F59E0B" label="Submit Answer" sub="Lock in your choice"
              onClick={handleSubmit} disabled={selected===null}
            />
          )}

          {/* Next */}
          {(submitted||timesUp) && (
            <ABtn color="#AFA9EC"
              label={qIdx+1>=totalQ ? 'Finish Round 08' : 'Next Boss Question'}
              sub={qIdx+1>=totalQ ? 'Reveal the winner!' : 'Q2 begins'}
              onClick={onNext}
            />
          )}
        </div>
      </div>
    </>
  )
}

function ABtn({ color, label, sub, onClick, disabled }) {
  return (
    <button style={{
      background:'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))',
      backdropFilter:'blur(20px)',
      border:`1px solid ${disabled?'rgba(255,255,255,0.04)':`${color}35`}`,
      borderRadius:16, padding:'16px 28px', display:'flex', flexDirection:'column',
      alignItems:'center', gap:4, cursor:disabled?'not-allowed':'pointer',
      opacity:disabled?0.35:1, minWidth:160,
      transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
    }}
      onClick={disabled?undefined:onClick}
      onMouseEnter={e=>{if(disabled)return;e.currentTarget.style.borderColor=color;e.currentTarget.style.transform='translateY(-3px)'}}
      onMouseLeave={e=>{if(disabled)return;e.currentTarget.style.borderColor=`${color}35`;e.currentTarget.style.transform='translateY(0)'}}
    >
      <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color}}>{label}</span>
      {sub&&<span style={{fontSize:10,color:'var(--text-muted)',fontFamily:'Inter,sans-serif'}}>{sub}</span>}
    </button>
  )
}

function Status({ msg }) {
  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'rgba(245,158,11,0.5)',fontFamily:"'Playfair Display',serif",fontSize:16,letterSpacing:2}}>{msg}</div>
    </div>
  )
}

const S = {
  page:        { minHeight:'100vh', background:'var(--bg-primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px 40px', gap:20, position:'relative' },
  startCard:   { width:'100%', maxWidth:500, padding:'44px 48px', display:'flex', flexDirection:'column', alignItems:'center', gap:14 },
  bossLabel:   { fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:700, letterSpacing:3, color:'rgba(245,158,11,0.7)' },
  rulesBox:    { width:'100%', background:'rgba(255,255,255,0.03)', borderRadius:14, padding:'16px 20px', display:'flex', flexDirection:'column', gap:10, border:'1px solid rgba(255,255,255,0.07)' },
  rulesTitle:  { fontSize:10, letterSpacing:3, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:4, fontFamily:'Inter,sans-serif' },
  rulesRow:    { display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, fontFamily:'Inter,sans-serif', color:'var(--text-secondary)' },
  backBtn:     { background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9999, padding:'10px 20px', color:'rgba(255,255,255,0.4)', fontSize:12, letterSpacing:1, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.2s ease' },
  header:      { width:'100%', maxWidth:880, display:'flex', justifyContent:'space-between', alignItems:'center' },
  scorePrev:   { display:'flex', flexDirection:'column', alignItems:'center', gap:2 },
  qCard:       { width:'100%', maxWidth:880, padding:'36px 40px', display:'flex', flexDirection:'column', gap:20 },
  qEn:         { fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'var(--text-primary)', lineHeight:1.65 },
  qKn:         { fontSize:16, color:'var(--text-secondary)', lineHeight:1.7, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.07)' },
  option:      { backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:14, transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)', textAlign:'left', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)' },
  optLetter:   { fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:900, opacity:0.35, flexShrink:0, width:20, paddingTop:2 },
  hintCard:    { background:'rgba(239,159,39,0.07)', border:'1px solid rgba(239,159,39,0.25)', borderRadius:12, padding:'14px 18px' },
  resultBanner:{ display:'flex', alignItems:'center', gap:10, border:'1px solid', borderRadius:12, padding:'14px 20px', fontSize:14, color:'var(--text-secondary)', backdropFilter:'blur(10px)' },
  actions:     { display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', width:'100%', maxWidth:880 },
}
