import { useState, useEffect, useRef } from 'react'
import { useGame } from '../context/GameContext'
import ScoreBar from '../components/common/ScoreBar'
import SaveButton from '../components/common/SaveButton'
import { api } from '../services/api'
import { sounds } from '../utils/sounds'

const TEAM_TIME = 10 * 60
const A = '#FB923C'

export default function Round05PlayPage() {
  const { teams, addScore, tossWinner, setPhase, markRoundDone, markAnswered, getAnswered } = useGame()
  const [set1, setSet1] = useState([])
  const [set2, setSet2] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [teamPhase, setTeamPhase] = useState(null) // null | 1 | 2 | 'done'

  const firstTeam  = tossWinner || 1
  const secondTeam = firstTeam === 1 ? 2 : 1

  useEffect(() => {
    setLoading(true)
    api.getR05Questions()
      .then(d => {
        const s1 = d.set1 || []
        const s2 = d.set2 || []
        if (!s1.length && !s2.length) { setError('No questions received'); setLoading(false); return }
        setSet1(s1); setSet2(s2); setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <div style={{width:40,height:40,borderRadius:'50%',border:`3px solid ${A}33`,borderTopColor:A,animation:'spin 1s linear infinite'}} />
      <div style={{color:`${A}88`,fontFamily:"'Playfair Display',serif",fontSize:16,letterSpacing:2}}>Loading Agni Pariksha…</div>
    </div>
  )

  if (error) return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#EF4444',fontFamily:"'Playfair Display',serif",fontSize:14,textAlign:'center',padding:24}}>
        Error: {error}<br/><span style={{fontSize:12,opacity:0.6}}>Is the backend running on port 8000?</span>
      </div>
    </div>
  )

  if (!set1.length) return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:`${A}88`,fontFamily:"'Playfair Display',serif",fontSize:14}}>No questions found.</div>
    </div>
  )

  // ── Start screen ─────────────────────────────────────────────
  if (teamPhase === null) {
    const name1 = firstTeam===1 ? teams.team1 : teams.team2
    const name2 = firstTeam===1 ? teams.team2 : teams.team1
    return (
      <>
        <ScoreBar />
        <div style={S.page}>
          {['tl','tr','bl','br'].map(p=><div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:A}}/>)}
          <div style={S.startCard} className="glass-card fade-in">
            <div style={{fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:700,letterSpacing:4,color:`${A}99`}}>ROUND 05 · AGNI PARIKSHA</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:900,color:A,textAlign:'center'}}>Ready to Begin?</div>
            <div className="gold-line" style={{margin:'10px auto',background:`linear-gradient(90deg,transparent,${A},transparent)`}} />
            <div style={{display:'flex',flexDirection:'column',gap:8,width:'100%'}}>
              <div style={S.teamRow}>
                <span style={{color:'#FFD700',fontWeight:700}}>{name1}</span>
                <span style={{color:'var(--text-muted)',fontSize:12}}>Set 1 · Goes first</span>
                <span style={{color:`${A}99`,fontSize:13}}>20Q · 10 min</span>
              </div>
              <div style={S.teamRow}>
                <span style={{color:'#FFA500',fontWeight:700}}>{name2}</span>
                <span style={{color:'var(--text-muted)',fontSize:12}}>Set 2 · Goes second</span>
                <span style={{color:`${A}99`,fontSize:13}}>20Q · 10 min</span>
              </div>
            </div>
            <div style={{fontSize:12,color:'var(--text-muted)',textAlign:'center',lineHeight:1.7}}>
              No negative marking · +10 per correct answer
            </div>
            <div style={{display:'flex',gap:12}}>
              <button style={S.backBtn} onClick={()=>setPhase('roundSelect')}>← Back to Rounds</button>
              <button className="btn-gold" style={{borderColor:`${A}55`,color:A,padding:'14px 40px'}}
                onClick={()=>setTeamPhase(firstTeam)}>
                Start — {name1} goes first
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Round complete screen ─────────────────────────────────────
  if (teamPhase === 'done') {
    return (
      <>
        <ScoreBar />
        <div style={S.page}>
          {['tl','tr','bl','br'].map(p=><div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:A}}/>)}
          <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:20}} className="fade-in">
            <div style={{fontSize:52}}>🔥</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,letterSpacing:5,color:`${A}88`}}>ROUND COMPLETE</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,color:A}}>Agni Pariksha Done</div>
            <div style={{display:'flex',gap:12,marginTop:8}}>
              <button style={S.backBtn} onClick={()=>setPhase('roundSelect')}>← Back to Rounds</button>
              <button className="btn-gold" style={{borderColor:`${A}55`,color:A}}
                onClick={()=>{markRoundDone(5);setPhase('roundSelect')}}>
                Continue →
              </button>
              <SaveButton />
            </div>
          </div>
        </div>
      </>
    )
  }

  const isFirst   = teamPhase === firstTeam
  const qs        = isFirst ? set1 : set2
  const teamName  = teamPhase===1 ? teams.team1 : teams.team2
  const teamColor = teamPhase===1 ? '#FFD700' : '#FFA500'
  const nextTeam  = isFirst ? secondTeam : 'done'

  return (
    <RapidFireSession key={teamPhase}
      teamName={teamName} teamColor={teamColor} teamN={teamPhase}
      questions={qs} addScore={addScore}
        markAnswered={markAnswered} getAnswered={getAnswered} setKey={`r05_${teamPhase==='team1'?'set1':'set2'}`}
      onFinish={()=>setTeamPhase(nextTeam)}
      onBack={()=>setPhase('roundSelect')}
    />
  )
}

// ── RapidFireSession ──────────────────────────────────────────────
function RapidFireSession({ teamName, teamColor, teamN, questions, addScore, onFinish, onBack, markAnswered, getAnswered, setKey }) {
  const [qIdx,       setQIdx]      = useState(() => {
    if (typeof getAnswered !== 'function' || !setKey) return 0
    const done = getAnswered(setKey)
    // Resume from first unanswered question
    let start = 0
    while (done.has(start) && start < 20) start++
    return Math.min(start, 19)
  })
  const [selected,   setSelected]  = useState(null)
  const [submitted,  setSubmitted] = useState(false)
  const [timeLeft,   setTimeLeft]  = useState(TEAM_TIME)
  const [running,    setRunning]   = useState(false)
  const [started,    setStarted]   = useState(false)
  const [timesUp,    setTimesUp]   = useState(false)
  const [score,      setScore]     = useState(0)
  const [hintShown,  setHintShown] = useState(false)
  const timerRef = useRef(null)

  useEffect(()=>{
    if(!running)return
    timerRef.current = setInterval(()=>setTimeLeft(t=>{
      if(t<=1){clearInterval(timerRef.current);setRunning(false);setTimesUp(true);sounds.timerEnd();return 0}
      if(t<=30) sounds.tick()
      return t-1
    }),1000)
    return ()=>clearInterval(timerRef.current)
  },[running])

  // Reset hint when question changes
  useEffect(()=>{ setHintShown(false) },[qIdx])

  const handleStart = ()=>{ setStarted(true); setRunning(true) }

  const handleSubmit = ()=>{
    if(selected===null||submitted)return
    const q = questions[qIdx]
    const ok = selected === q.answer
    setSubmitted(true)
    if(ok){ addScore(teamN,10); setScore(s=>s+10); if(markAnswered&&setKey) markAnswered(setKey, qIdx); sounds.correct() }
    else sounds.wrong()
  }

  const handleNext = ()=>{
    if(qIdx+1>=questions.length||timesUp){ onFinish(); return }
    setQIdx(i=>i+1); setSelected(null); setSubmitted(false)
  }

  const q = questions[qIdx]
  if(!q) return null

  const mins   = String(Math.floor(timeLeft/60)).padStart(2,'0')
  const secs   = String(timeLeft%60).padStart(2,'0')
  const danger = timeLeft<=60
  const pct    = timeLeft/TEAM_TIME
  const R=50, circ=2*Math.PI*R
  const hint   = q.hint_en || q.hint_kn || ''

  // ── Pre-start screen ────────────────────────────────────────
  if(!started) return (
    <>
      <ScoreBar />
      <div style={S.page}>
        {['tl','tr','bl','br'].map(p=><div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:teamColor}}/>)}
        <div style={S.startCard} className="glass-card fade-in">
          <div style={{fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:700,letterSpacing:4,color:'rgba(251,146,60,0.6)'}}>AGNI PARIKSHA · 10 MINUTES</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,color:teamColor,textAlign:'center'}}>{teamName}'s Turn</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',textAlign:'center',lineHeight:1.7}}>
            {questions.length} questions · +10 per correct · No negative marking<br/>
            Timer starts when you tap Start
          </div>
          <div style={{display:'flex',gap:12}}>
            <button style={S.backBtn} onClick={onBack}>← Back</button>
            <button className="btn-gold" style={{borderColor:`${teamColor}55`,color:teamColor,padding:'14px 36px'}} onClick={handleStart}>
              Start Timer
            </button>
          </div>
        </div>
      </div>
    </>
  )

  // ── Play screen ──────────────────────────────────────────────
  return (
    <>
      <ScoreBar />
      <div style={{...S.page, justifyContent:'flex-start', paddingTop:80}}>
        {['tl','tr','bl','br'].map(p=><div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:teamColor}}/>)}

        {/* Header row */}
        <div style={S.header}>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <button style={S.backBtnSm} onClick={onBack}>← Back to Rounds</button>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:teamColor}}>{teamName}</div>
            <div style={{fontSize:12,color:'var(--text-muted)',fontFamily:'Inter,sans-serif'}}>Q{qIdx+1}/{questions.length} · +{score} pts this round</div>
            <div style={{width:'100%',height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,marginTop:6}}>
              <div style={{height:'100%',borderRadius:2,background:teamColor,width:`${((qIdx)/questions.length)*100}%`,transition:'width 0.5s ease'}}/>
            </div>
          </div>

          {/* Circular timer */}
          <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(251,146,60,0.08)" strokeWidth="4"/>
              <circle cx="60" cy="60" r={R} fill="none"
                stroke={danger?'#EF4444':'#FB923C'} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${pct*circ} ${circ}`} strokeDashoffset={circ*0.25}
                transform="rotate(-90 60 60)"
                style={{transition:'stroke-dasharray 1s linear,stroke 0.4s ease'}}
              />
            </svg>
            <div style={{position:'absolute',display:'flex',flexDirection:'column',alignItems:'center'}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:danger?'#EF4444':'#FB923C',lineHeight:1,animation:danger?'timerDanger 0.8s ease-in-out infinite':'none'}}>
                {mins}:{secs}
              </div>
              <div style={{fontSize:8,letterSpacing:2,color:'var(--text-muted)'}}>LEFT</div>
            </div>
          </div>
        </div>

        {/* Question card */}
        <div style={S.qCard} className="glass-card">
          {/* Question text */}
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:'var(--text-primary)',lineHeight:1.65}}>
            {q.question_en}
          </div>
          {q.question_kn && (
            <div style={{fontSize:15,color:'var(--text-secondary)',lineHeight:1.7,paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.07)'}}>
              {q.question_kn}
            </div>
          )}

          {/* Options — Round01 style */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:4}}>
            {(q.options_en||[]).map((opt,i)=>{
              const kn = q.options_kn?.[i] || ''
              let bg='rgba(255,255,255,0.04)', border='rgba(255,255,255,0.09)'
              if(submitted){
                if(i===q.answer)                    { bg='rgba(34,197,94,0.12)';  border='rgba(34,197,94,0.6)'  }
                else if(i===selected&&i!==q.answer) { bg='rgba(239,68,68,0.12)';  border='rgba(239,68,68,0.6)'  }
              } else if(i===selected) { bg=`${teamColor}15`; border=teamColor }

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
                  }}
                  onClick={()=>{ if(!submitted) setSelected(i) }}
                  onMouseEnter={e=>{ if(!submitted&&i!==selected){ e.currentTarget.style.borderColor=teamColor; e.currentTarget.style.transform='translateX(4px)' }}}
                  onMouseLeave={e=>{ if(!submitted&&i!==selected){ e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'; e.currentTarget.style.transform='translateX(0)' }}}
                >
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:900,opacity:0.35,flexShrink:0,width:20,paddingTop:2}}>
                    {['A','B','C','D'][i]}
                  </span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,color:'var(--text-primary)',lineHeight:1.4}}>{opt}</div>
                    {kn && <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:3,lineHeight:1.4}}>{kn}</div>}
                  </div>
                  {submitted&&i===q.answer          && <span style={{color:'#22C55E',fontSize:16,animation:'scorePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>✓</span>}
                  {submitted&&i===selected&&i!==q.answer && <span style={{color:'#EF4444',fontSize:16}}>✕</span>}
                </button>
              )
            })}
          </div>

          {/* Hint */}
          {hint && !hintShown && !submitted && (
            <button style={S.hintToggle} onClick={()=>setHintShown(true)}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700}}>💡 Show Hint</span>
            </button>
          )}
          {hintShown && hint && (
            <div style={S.hintBox} className="scale-in">
              <span style={{fontSize:18,flexShrink:0}}>💡</span>
              <div style={{fontSize:14,color:'rgba(239,159,39,0.9)',lineHeight:1.65,fontFamily:'Inter,sans-serif'}}>{hint}</div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
          {!timesUp && !submitted && (
            <button
              style={{...S.actionBtn, borderColor:`${teamColor}35`, color:teamColor, opacity:selected===null?0.35:1, cursor:selected===null?'not-allowed':'pointer'}}
              onClick={selected!==null ? handleSubmit : undefined}
              onMouseEnter={e=>{ if(selected!==null){ e.currentTarget.style.borderColor=teamColor; e.currentTarget.style.transform='translateY(-3px) scale(1.02)' }}}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=`${teamColor}35`; e.currentTarget.style.transform='translateY(0) scale(1)' }}
            >
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700}}>Submit</span>
              <span style={{fontSize:10,opacity:0.5,fontFamily:'Inter,sans-serif'}}>Lock in answer</span>
            </button>
          )}
          {(submitted || timesUp) && (
            <button
              style={{...S.actionBtn, borderColor:'rgba(175,169,236,0.4)', color:'#AFA9EC'}}
              onClick={handleNext}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='#AFA9EC'; e.currentTarget.style.transform='translateY(-3px) scale(1.02)' }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(175,169,236,0.4)'; e.currentTarget.style.transform='translateY(0) scale(1)' }}
            >
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700}}>
                {qIdx+1>=questions.length||timesUp ? 'Finish' : 'Next →'}
              </span>
              <span style={{fontSize:10,opacity:0.5,fontFamily:'Inter,sans-serif'}}>{qIdx+1}/{questions.length}</span>
            </button>
          )}
          {timesUp && !submitted && (
            <button
              style={{...S.actionBtn, borderColor:'rgba(251,146,60,0.4)', color:'#FB923C'}}
              onClick={onFinish}
            >
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700}}>Time's Up — Continue</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}

const S = {
  page:       { minHeight:'100vh', background:'var(--bg-primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px 40px', gap:24, position:'relative' },
  startCard:  { width:'100%', maxWidth:520, padding:'40px 44px', display:'flex', flexDirection:'column', alignItems:'center', gap:16 },
  teamRow:    { display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.03)', borderRadius:12, padding:'12px 16px', border:'1px solid rgba(255,255,255,0.06)', fontFamily:'Inter,sans-serif', fontSize:14 },
  backBtn:    { background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9999, padding:'12px 20px', color:'rgba(255,255,255,0.4)', fontSize:12, letterSpacing:1, cursor:'pointer', fontFamily:'Inter,sans-serif' },
  backBtnSm:  { background:'none', border:'none', color:'rgba(251,146,60,0.35)', fontSize:12, letterSpacing:1, cursor:'pointer', fontFamily:'Inter,sans-serif', padding:0 },
  header:     { width:'100%', maxWidth:800, display:'flex', justifyContent:'space-between', alignItems:'center' },
  qCard:      { width:'100%', maxWidth:800, padding:'32px 36px', display:'flex', flexDirection:'column', gap:18 },
  actionBtn:  { background:'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))', backdropFilter:'blur(20px)', border:'1px solid', borderRadius:16, padding:'16px 32px', display:'flex', flexDirection:'column', alignItems:'center', gap:3, cursor:'pointer', transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)', minWidth:160 },
  hintToggle: { background:'rgba(239,159,39,0.06)', border:'1px solid rgba(239,159,39,0.28)', borderRadius:12, padding:'10px 20px', display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:'#EF9F27', alignSelf:'flex-start', transition:'all 0.2s ease' },
  hintBox:    { display:'flex', gap:12, background:'rgba(239,159,39,0.08)', border:'1px solid rgba(239,159,39,0.28)', borderRadius:14, padding:'16px 20px', backdropFilter:'blur(10px)' },
}
