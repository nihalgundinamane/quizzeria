import { useState, useEffect, useRef, useCallback } from 'react'
import { useGame } from '../context/GameContext'
import ScoreBar from '../components/common/ScoreBar'
import SaveButton from '../components/common/SaveButton'
import QuestionSidebar from '../components/common/QuestionSidebar'
import { api } from '../services/api'
import { sounds } from '../utils/sounds'

const TIMER_SEC = 30

export default function Round04PlayPage() {
  const { teams, addScore, setPhase, markRoundDone, markAnswered, getAnswered, answerProgress } = useGame()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [qIdx, setQIdx]           = useState(0)
  const [roundDone, setRoundDone] = useState(false)

  // Derive done set directly from context — resets instantly on new game
  const done = getAnswered('r04')

  useEffect(() => {
    api.getR04Questions()
      .then(d => { setQuestions(d.questions); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return <Status msg="Loading Buzzer Battle…" />
  if (error)   return <Status msg={`${error} — backend running?`} color="#EF4444" />
  if (!questions.length) return <Status msg="No questions found." />

  const q = questions[Math.min(qIdx, questions.length-1)]

  return (
    <>
      <ScoreBar />
      {roundDone && (
        <div style={{position:'fixed',inset:0,background:'rgba(10,10,15,0.92)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,zIndex:200}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:'#F87171'}}>⚡ Buzzer Battle Complete!</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.4)',fontFamily:'Inter,sans-serif'}}>All {questions.length} questions done</div>
          <SaveButton />
          <button className="btn-gold" style={{borderColor:'rgba(248,113,113,0.5)',color:'#F87171'}}
            onClick={()=>setPhase('roundSelect')}>Back to Rounds →</button>
        </div>
      )}
      <QuestionSidebar total={questions.length} currentIndex={qIdx} completedSet={done} roundLabel="Buzzer Battle" onJump={setQIdx}/>
      <BuzzerEngine
        q={q} qIdx={qIdx} total={questions.length}
        teams={teams} addScore={addScore}
        markAnswered={markAnswered} getAnswered={getAnswered}
        onNext={() => {
          markAnswered('r04', qIdx)
          if (qIdx+1>=questions.length) { markRoundDone(4); setRoundDone(true) }
          else setQIdx(i=>i+1)
        }}
        onBack={() => setPhase('roundSelect')}
        onMarkDone={() => markAnswered('r04', qIdx)}
      />
    </>
  )
}

function BuzzerEngine({ q, qIdx, total, teams, addScore, onNext, onBack, onMarkDone, markAnswered }) {
  // buzzerTeam: null = waiting for buzz, 1 or 2 = team that buzzed first
  const [buzzerTeam, setBuzzerTeam] = useState(null)
  const [optShown, setOptShown]   = useState(false)
  const [t1Sel, setT1Sel]         = useState(null)
  const [t2Sel, setT2Sel]         = useState(null)
  const [t1Res, setT1Res]         = useState(null)
  const [t2Res, setT2Res]         = useState(null)
  const [pass, setPass]           = useState(false)
  const [reveal, setReveal]       = useState(false)
  const [timeLeft, setTimeLeft]   = useState(TIMER_SEC)
  const [timerOn, setTimerOn]     = useState(false)
  const [badge, setBadge]         = useState(null)
  const [hint, setHint]           = useState(null)
  const [hintLoad, setHintLoad]   = useState(false)
  const [showKn, setShowKn]       = useState(false)
  const timerRef = useRef(null)

  const stopTimer = useCallback(()=>{ setTimerOn(false); clearInterval(timerRef.current) },[])

  // Reset all state on new question
  useEffect(()=>{
    setBuzzerTeam(null)
    setOptShown(false); setT1Sel(null); setT2Sel(null)
    setT1Res(null); setT2Res(null); setPass(false); setReveal(false)
    setTimeLeft(TIMER_SEC); stopTimer(); setBadge(null); setHint(null); setHintLoad(false); setShowKn(false)
  },[qIdx])

  useEffect(()=>{
    if(!timerOn)return
    timerRef.current=setInterval(()=>setTimeLeft(t=>{if(t<=1){stopTimer();return 0}return t-1}),1000)
    return ()=>clearInterval(timerRef.current)
  },[timerOn,stopTimer])

  // Auto-pass on timer reaching 0
  useEffect(()=>{
    if(timeLeft!==0)return
    if(t1Res!==null||t2Res!==null)return
    sounds.timerEnd()
    if(!pass){
      setT1Res('wrong')
      if(!optShown){
        addScore(buzzerTeam,-10)
        setBadge({pts:10,color:'#EF4444',team:buzzerTeam,negative:true})
      }
      setPass(true)
      if(optShown){ setTimeLeft(TIMER_SEC); setTimerOn(true) }
    } else {
      setT2Res('wrong')
    }
  },[timeLeft])

  const firstTeam  = buzzerTeam
  const secondTeam = buzzerTeam===1?2:1
  const curTeam    = pass ? secondTeam : firstTeam
  const curName    = curTeam===1 ? teams.team1 : teams.team2
  const bothWrong  = t1Res==='wrong' && t2Res==='wrong'
  const isDone     = t1Res==='correct' || t2Res==='correct' || reveal || bothWrong
  const timedOut   = timeLeft===0 && t2Res!==null
  const danger     = timeLeft<=10

  const popScore=(pts,color,team)=>{
    setBadge({pts,color,team})
    addScore(team,pts)
    onMarkDone()
    sounds.score()
  }

  const judge=(correct)=>{
    stopTimer()
    if(!pass){
      setT1Res(correct?'correct':'wrong')
      if(correct){ popScore(20,'#F87171',firstTeam); sounds.correct() }
      else { setPass(true); sounds.wrong() }
    } else {
      setT2Res(correct?'correct':'wrong')
      if(correct){ popScore(5,'#F87171',secondTeam); sounds.correct() }
      else sounds.wrong()
    }
  }

  const getHint = async () => {
    if(hint||hintLoad)return; setHintLoad(true)
    try {
      const d = await api.getR04Hint(qIdx)
      setHint({en:d.hint_en||'',kn:d.hint_kn||''})
    } catch { setHint({en:'No hint available.',kn:''}) }
    finally { setHintLoad(false) }
  }

  const submit=()=>{
    const sel=pass?t2Sel:t1Sel; if(sel===null)return; stopTimer()
    const ok=sel===q.answer
    if(!pass){
      setT1Res(ok?'correct':'wrong')
      if(ok){popScore(10,'#F87171',firstTeam);sounds.correct();if(markAnswered)markAnswered('r04',qIdx)}
      else { setPass(true); sounds.pass() }
    } else {
      setT2Res(ok?'correct':'wrong')
      if(ok){popScore(5,'#F87171',secondTeam);sounds.correct()}
      else sounds.wrong()
    }
  }

  // Danger ticking sound
  useEffect(()=>{
    if(timerOn && danger && timeLeft > 0) sounds.tick()
  },[timeLeft])

  const optStyle=(i)=>{
    const base={...S.opt}
    if(!pass&&optShown&&!t1Res&&i===t1Sel) return{...base,background:'rgba(248,113,113,0.1)',borderColor:'rgba(248,113,113,0.7)'}
    if(pass&&!t2Res&&i===t2Sel) return{...base,background:'rgba(248,113,113,0.07)',borderColor:'rgba(248,113,113,0.5)'}
    if(t1Res==='wrong'&&i===t1Sel) return{...base,...S.optW}
    if(t2Res==='wrong'&&i===t2Sel) return{...base,...S.optW}
    if((t1Res==='correct'&&i===t1Sel)||(t2Res==='correct'&&i===t2Sel)) return{...base,...S.optC}
    if(reveal&&i===q.answer) return{...base,...S.optC}
    return base
  }
  const canPick=(optShown&&!t1Res&&!pass)||(pass&&!t2Res)
  const circ=2*Math.PI*20

  // ── Buzzer Selection Screen ──
  if (!buzzerTeam) {
    return (
      <div style={{...S.page, paddingLeft:148}}>
        <div style={S.topBar}>
          <div>
            <button style={S.back} onClick={onBack}>← Rounds</button>
            <span style={S.label}>BUZZER BATTLE &nbsp;<span style={{color:'var(--text-muted)'}}>Q{qIdx+1}/{total}</span></span>
          </div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.2)',fontFamily:'Inter,sans-serif',letterSpacing:1}}>WAITING FOR BUZZ</div>
        </div>

        {/* Question preview */}
        <div style={{...S.card, ...{paddingBottom:24}}} className="glass-card">
          {q.question_kn && (
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <button style={{...S.langBtn,color:showKn?'#F87171':'rgba(255,255,255,0.3)',borderColor:showKn?'rgba(248,113,113,0.4)':'rgba(255,255,255,0.1)'}}
                onClick={()=>setShowKn(v=>!v)}>{showKn?'🇬🇧 EN':'ಕನ್ನಡ'}</button>
            </div>
          )}
          <div style={S.qText}>{showKn&&q.question_kn?q.question_kn:q.question_en}</div>
          {q.question_kn&&(
            <div style={S.qKn}>{showKn?q.question_en:q.question_kn}</div>
          )}
        </div>

        {/* Buzzer buttons */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,width:'100%',maxWidth:860}}>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.3)',fontFamily:'Inter,sans-serif',letterSpacing:2,textTransform:'uppercase'}}>
            ⚡ Who pressed the buzzer first?
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,width:'100%'}}>
            {[1,2].map(n => {
              const name  = n===1?teams.team1:teams.team2
              const color = n===1?'#FFD700':'#FFA500'
              return (
                <button key={n}
                  onClick={() => { setBuzzerTeam(n); sounds.buzz() }}
                  style={{
                    padding:'32px 24px', borderRadius:20, cursor:'pointer',
                    border:`2px solid ${color}55`, background:`${color}08`,
                    color, fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700,
                    display:'flex', flexDirection:'column', alignItems:'center', gap:10,
                    transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${color}18`;e.currentTarget.style.borderColor=`${color}CC`;e.currentTarget.style.transform='translateY(-4px) scale(1.02)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background=`${color}08`;e.currentTarget.style.borderColor=`${color}55`;e.currentTarget.style.transform='translateY(0) scale(1)'}}>
                  <span style={{fontSize:36}}>🔔</span>
                  <span>{name||`Team ${n}`}</span>
                  <span style={{fontSize:12,opacity:0.55,fontFamily:'Inter,sans-serif',fontWeight:400,letterSpacing:1}}>BUZZED IN</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Main Question Screen (after buzz) ──
  return (
    <div style={{...S.page, paddingLeft:148}}>
      <div style={S.topBar}>
        <div>
          <button style={S.back} onClick={onBack}>← Rounds</button>
          <span style={S.label}>BUZZER BATTLE &nbsp;<span style={{color:'var(--text-muted)'}}>Q{qIdx+1}/{total}</span></span>
        </div>
        <div style={{...S.timerWrap,borderColor:danger?'rgba(248,113,113,0.5)':timerOn?'rgba(248,113,113,0.4)':'rgba(248,113,113,0.15)',animation:timerOn?(danger?'timerDanger 0.8s ease-in-out infinite':'timerPulse 2s ease-in-out infinite'):'none'}}>
          <svg style={S.timerSvg} viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(248,113,113,0.07)" strokeWidth="2.5"/>
            <circle cx="24" cy="24" r="20" fill="none" stroke={danger?'#EF4444':'#F87171'} strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={`${(timeLeft/TIMER_SEC)*circ} ${circ}`} strokeDashoffset={circ*0.25} transform="rotate(-90 24 24)"
              style={{transition:'stroke-dasharray 1s linear'}}/>
          </svg>
          <div style={{...S.timerNum,color:danger?'#EF4444':'#F87171'}}>{String(timeLeft).padStart(2,'0')}</div>
          <div style={S.timerSec}>SEC</div>
        </div>
      </div>

      {/* Team chip */}
      <div style={{display:'flex',justifyContent:'center'}}>
        <div style={{...S.chip,borderColor:curTeam===1?'rgba(248,113,113,0.5)':'rgba(248,113,113,0.35)'}}>
          {pass&&<span style={S.passTag}>⚡ PASS →</span>}
          <span style={{color:'#F87171',fontWeight:700}}>{curName}</span>
          <span style={{color:'var(--text-muted)'}}>'s Turn</span>
        </div>
      </div>

      {/* Question card */}
      <div style={S.card} className="glass-card">
        {q.question_kn && (
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button style={{...S.langBtn,color:showKn?'#F87171':'rgba(255,255,255,0.3)',borderColor:showKn?'rgba(248,113,113,0.4)':'rgba(255,255,255,0.1)'}}
              onClick={()=>setShowKn(v=>!v)}>{showKn?'🇬🇧 EN':'ಕನ್ನಡ'}</button>
          </div>
        )}
        <div style={S.qText}>{showKn&&q.question_kn?q.question_kn:q.question_en}</div>
        {q.question_kn&&(
          <div style={S.qKn}>{showKn?q.question_en:q.question_kn}</div>
        )}

        {/* Verbal judge */}
        {(!optShown||(pass&&!optShown))&&!isDone&&(
          <div style={S.judgeWrap}>
            <div style={S.judgeTitle}>Was <strong style={{color:'#F87171'}}>{curName}</strong>'s answer correct?</div>
            <div style={{display:'flex',gap:12}}>
              <button style={S.btnC} onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.08)'} onClick={()=>judge(true)}>✓ Correct</button>
              <button style={S.btnW} onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'} onClick={()=>judge(false)}>✕ Wrong</button>
            </div>
          </div>
        )}

        {/* Options */}
        {optShown&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {q.options_en.map((_,i)=>(
              <button key={i} style={{...optStyle(i),animation:'optionSlideIn 0.35s ease forwards',animationDelay:`${i*0.07}s`,opacity:0,animationFillMode:'forwards',cursor:canPick?'pointer':'default'}}
                onClick={()=>{if(!canPick)return;pass?setT2Sel(i):setT1Sel(i)}}
                onMouseEnter={e=>{if(!canPick)return;e.currentTarget.style.borderColor='rgba(248,113,113,0.7)';e.currentTarget.style.transform='translateX(4px)'}}
                onMouseLeave={e=>{if(!canPick)return;e.currentTarget.style.borderColor=optStyle(i).borderColor||'rgba(255,255,255,0.09)';e.currentTarget.style.transform='translateX(0)'}}>
                <span style={S.optLetter}>{['A','B','C','D'][i]}</span>
                <div>
                  <div style={{fontSize:15,color:'var(--text-primary)'}}>{q.options_en[i]}</div>
                  {q.options_kn?.[i]&&<div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:2}}>{q.options_kn[i]}</div>}
                </div>
                {((t1Res==='correct'&&i===t1Sel)||(t2Res==='correct'&&i===t2Sel)||(reveal&&i===q.answer))&&<span style={{color:'#22C55E',fontSize:16}}>✓</span>}
                {((t1Res==='wrong'&&i===t1Sel)||(t2Res==='wrong'&&i===t2Sel))&&<span style={{color:'#EF4444',fontSize:16}}>✕</span>}
              </button>
            ))}
          </div>
        )}

        {badge&&(
          <div style={{alignSelf:'flex-start',border:`1.5px solid ${badge.color}55`,borderRadius:9999,padding:'10px 28px',display:'flex',flexDirection:'column',alignItems:'center',background:`${badge.color}12`,color:badge.color,animation:'scorePop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900}}>{badge?.negative?'-':'+'}{badge.pts}</span>
            <span style={{fontSize:10,opacity:0.6}}>{badge.team===1?teams.team1:teams.team2}</span>
          </div>
        )}
        {hint&&(
          <div style={{display:'flex',gap:12,background:'rgba(239,159,39,0.08)',border:'1px solid rgba(239,159,39,0.28)',borderRadius:14,padding:'16px 20px',backdropFilter:'blur(10px)'}}>
            <span style={{fontSize:18,flexShrink:0}}>{'💡'}</span>
            <div>
              {hint.en&&<div style={{fontSize:14,color:'rgba(239,159,39,0.9)',lineHeight:1.65,fontFamily:'Inter,sans-serif'}}>{hint.en}</div>}
              {hint.kn&&<div style={{fontSize:12,color:'rgba(239,159,39,0.6)',lineHeight:1.6,marginTop:6,fontFamily:'Inter,sans-serif'}}>{hint.kn}</div>}
            </div>
          </div>
        )}
        {reveal&&<div style={{background:'rgba(34,197,94,0.07)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:12,padding:'14px 22px',fontSize:14,color:'var(--text-secondary)',textAlign:'center'}}>
          Answer: <strong style={{color:'#22C55E'}}>{q.options_en[q.answer]}</strong>
          {q.options_kn?.[q.answer]&&<div style={{fontSize:12,color:'rgba(34,197,94,0.6)',marginTop:4}}>{q.options_kn[q.answer]}</div>}
        </div>}
      </div>

      {/* Actions */}
      <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center',width:'100%',maxWidth:860}}>
        {!optShown&&!isDone&&<Btn color="#F87171" label="Show Options" sub="4 options · starts timer" onClick={()=>{setOptShown(true);setTimeLeft(TIMER_SEC);setTimerOn(true)}}/>}
        {optShown&&!isDone&&<Btn color="#F87171" label="Submit" sub="Lock answer" onClick={submit} disabled={pass?t2Sel===null:t1Sel===null}/>}
        {!hint&&!isDone&&<Btn color="#EF9F27" label={hintLoad?"Loading...":"Show Hint"} sub="Bilingual hint" onClick={getHint} disabled={hintLoad}/>}
        {bothWrong&&!reveal&&<Btn color="#5DCAA5" label="Show Answer" sub="Reveal correct" onClick={()=>setReveal(true)}/>}
        {(isDone||timedOut)&&<Btn color="#AFA9EC" label="Next Question" sub={qIdx+1>=total?'Back to rounds':'Q'+(qIdx+2)+' →'} onClick={onNext}/>}
      </div>
    </div>
  )
}

function Btn({color,label,sub,onClick,disabled}){
  return(
    <button style={{background:'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))',backdropFilter:'blur(20px)',border:`1px solid ${disabled?'rgba(255,255,255,0.04)':`${color}35`}`,borderRadius:16,padding:'16px 28px',display:'flex',flexDirection:'column',alignItems:'center',gap:4,minWidth:160,opacity:disabled?0.35:1,cursor:disabled?'not-allowed':'pointer',transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)'}}
      onClick={disabled?undefined:onClick}
      onMouseEnter={e=>{if(disabled)return;e.currentTarget.style.borderColor=color;e.currentTarget.style.transform='translateY(-3px) scale(1.02)'}}
      onMouseLeave={e=>{if(disabled)return;e.currentTarget.style.borderColor=`${color}35`;e.currentTarget.style.transform='translateY(0) scale(1)'}}>
      <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color}}>{label}</span>
      <span style={{fontSize:10,letterSpacing:1,color:'var(--text-muted)',fontFamily:'Inter,sans-serif'}}>{sub}</span>
    </button>
  )
}

function Status({msg,color='rgba(248,113,113,0.5)'}){
  return<div style={{minHeight:'100vh',background:'var(--bg-primary)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Playfair Display',serif",color,fontSize:16,textAlign:'center',padding:24}}>{msg}</div></div>
}

const S = {
  page:{minHeight:'100vh',background:'var(--bg-primary)',display:'flex',flexDirection:'column',alignItems:'center',padding:'72px 24px 40px',gap:18,position:'relative'},
  topBar:{width:'100%',maxWidth:860,display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8},
  back:{background:'none',border:'none',color:'rgba(248,113,113,0.3)',fontSize:12,letterSpacing:1,cursor:'pointer',fontFamily:'Inter,sans-serif',padding:0},
  label:{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#F87171',marginLeft:8},
  timerWrap:{position:'relative',width:76,height:76,borderRadius:'50%',border:'2px solid',background:'rgba(18,18,34,0.7)',backdropFilter:'blur(20px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',transition:'border-color 0.3s ease'},
  timerSvg:{position:'absolute',inset:-3,width:'calc(100% + 6px)',height:'calc(100% + 6px)',pointerEvents:'none'},
  timerNum:{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,lineHeight:1,zIndex:1},
  timerSec:{fontSize:8,letterSpacing:2,color:'var(--text-muted)',fontFamily:'Inter,sans-serif',zIndex:1},
  chip:{border:'1.5px solid',borderRadius:9999,padding:'9px 32px',fontFamily:"'Playfair Display',serif",fontSize:15,display:'flex',alignItems:'center',gap:10,background:'rgba(14,14,26,0.8)',backdropFilter:'blur(20px)'},
  passTag:{fontSize:10,letterSpacing:2,color:'#F87171',fontFamily:'Inter,sans-serif',opacity:0.8},
  card:{width:'100%',maxWidth:860,padding:'36px 44px',display:'flex',flexDirection:'column',gap:20},
  langBtn:{background:'rgba(255,255,255,0.04)',border:'1px solid',borderRadius:20,padding:'5px 14px',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.2s',backdropFilter:'blur(10px)',letterSpacing:1},
  qText:{fontFamily:"'Playfair Display',serif",fontSize:21,fontWeight:700,color:'var(--text-primary)',lineHeight:1.65},
  qKn:{fontFamily:'sans-serif',fontSize:15,color:'rgba(255,255,255,0.4)',lineHeight:1.7,marginTop:4,paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.06)'},
  judgeWrap:{display:'flex',flexDirection:'column',gap:12},
  judgeTitle:{fontSize:13,color:'var(--text-secondary)',fontFamily:'Inter,sans-serif'},
  btnC:{flex:1,padding:'18px',borderRadius:16,cursor:'pointer',fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,border:'1.5px solid rgba(34,197,94,0.4)',background:'rgba(34,197,94,0.08)',color:'#22C55E',transition:'background 0.2s',backdropFilter:'blur(10px)'},
  btnW:{flex:1,padding:'18px',borderRadius:16,cursor:'pointer',fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,border:'1.5px solid rgba(239,68,68,0.4)',background:'rgba(239,68,68,0.08)',color:'#EF4444',transition:'background 0.2s',backdropFilter:'blur(10px)'},
  opt:{background:'rgba(255,255,255,0.04)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'flex-start',gap:14,textAlign:'left',transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)'},
  optC:{background:'rgba(34,197,94,0.12)',borderColor:'rgba(34,197,94,0.6)',boxShadow:'0 0 28px rgba(34,197,94,0.2)',animation:'correctPulse 0.7s ease forwards'},
  optW:{background:'rgba(239,68,68,0.12)',borderColor:'rgba(239,68,68,0.6)',animation:'wrongShake 0.5s ease forwards'},
  optLetter:{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:900,opacity:0.35,flexShrink:0,width:20,paddingTop:2},
}
