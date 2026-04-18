import { useState, useEffect, useRef, useCallback } from 'react'
import { useGame } from '../context/GameContext'
import ScoreBar from '../components/common/ScoreBar'
import QuestionSidebar from '../components/common/QuestionSidebar'
import { api } from '../services/api'
import { sounds } from '../utils/sounds'

const TIMER_SEC = 30

/* ── Heartbeat tick sound via Web Audio ─────────────────────── */
function playTick(audioCtxRef, urgent = false) {
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = urgent ? 880 : 660
    osc.type = 'sine'
    const t = ctx.currentTime
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(urgent ? 0.22 : 0.14, t + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, t + (urgent ? 0.12 : 0.09))
    osc.start(t); osc.stop(t + 0.15)
  } catch(e) {}
}

export default function QuestionPlayPage() {
  const { teams, addScore, currentCategory, categoryIndex, questionIndex,
          setQuestionIndex, nextQuestion, teamForQuestion, finishCategory,
          completedQuestions, markQuestionDone, cancelCategory,
          markAnswered, getAnswered, currentCategory: ctxCategory } = useGame()
  const [questions, setQuestions] = useState([])
  // Seed completedQuestions from saved progress when category loads
  useEffect(() => {
    if (!currentCategory) return
    const saved = getAnswered ? getAnswered(`r01_${currentCategory.id}`) : new Set()
    if (saved.size > 0) {
      saved.forEach(idx => markQuestionDone && markQuestionDone(idx))
    }
  }, [currentCategory?.id])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (!currentCategory) return
    setLoading(true); setError(null)
    api.getR01Questions(currentCategory.id)
      .then(d => { setQuestions(d.questions); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [currentCategory?.id])

  if (loading) return <Stat msg="Loading questions…" />
  if (error)   return <Stat msg={`${error} — backend on port 8000?`} color="#EF4444" />
  if (!questions.length) return <Stat msg="No questions found." />

  return (
    <>
      <ScoreBar />
      <QuestionSidebar total={questions.length} currentIndex={questionIndex}
        completedSet={completedQuestions} roundLabel={currentCategory?.label || ''}
        onJump={i => setQuestionIndex(i)} />
      <Engine questions={questions} currentCategory={currentCategory}
        categoryIndex={categoryIndex} questionIndex={questionIndex}
        nextQuestion={nextQuestion} finishCategory={finishCategory} cancelCategory={cancelCategory}
        teamForQuestion={teamForQuestion} teams={teams}
        addScore={addScore} markQuestionDone={markQuestionDone}
        markAnswered={markAnswered} getAnswered={getAnswered} />
    </>
  )
}

function Engine({ questions, currentCategory, categoryIndex, questionIndex,
                  nextQuestion, finishCategory, cancelCategory, teamForQuestion, teams, addScore, markQuestionDone, markAnswered, getAnswered }) {
  const { recordCorrect, recordWrong } = useGame()
  const q = questions[Math.min(questionIndex, questions.length-1)]
  const pri = teamForQuestion(questionIndex, categoryIndex)
  const oth = pri===1?2:1

  const [optShown,  setOptShown]  = useState(false)
  const [t1Sel,     setT1Sel]     = useState(null)
  const [t2Sel,     setT2Sel]     = useState(null)
  const [t1Res,     setT1Res]     = useState(null)
  const [t2Res,     setT2Res]     = useState(null)
  const [pass,      setPass]      = useState(false)
  const [reveal,    setReveal]    = useState(false)
  const [timeLeft,  setTimeLeft]  = useState(TIMER_SEC)
  const [timerOn,   setTimerOn]   = useState(false)
  const [badge,     setBadge]     = useState(null)
  const [floaters,  setFloaters]  = useState([])
  const [hint,      setHint]      = useState(null)
  const [hintLoad,  setHintLoad]  = useState(false)
  const [qReveal,   setQReveal]   = useState(false)
  const timerRef    = useRef(null)
  const audioCtxRef = useRef(null)
  const lastTickRef = useRef(null)

  const stopTimer = useCallback(() => { setTimerOn(false); clearInterval(timerRef.current) }, [])

  // ── Countdown heartbeat: tick sound + pulse last 5 seconds ───
  useEffect(() => {
    if (!timerOn) return
    if (timeLeft <= 5 && timeLeft > 0) {
      if (lastTickRef.current !== timeLeft) {
        lastTickRef.current = timeLeft
        playTick(audioCtxRef, timeLeft <= 3)
      }
    }
  }, [timeLeft, timerOn])
  useEffect(() => {
    if (!timerOn) return
    timerRef.current = setInterval(() => setTimeLeft(t => { if(t<=1){stopTimer();return 0} return t-1 }), 1000)
    return () => clearInterval(timerRef.current)
  }, [timerOn, stopTimer])

  // Auto-pass when timer hits 0
  useEffect(() => {
    if (timeLeft !== 0) return
    if (t1Res !== null || t2Res !== null) return // already judged
    if (!pass) {
      // Primary team ran out of time — auto pass
      setT1Res('wrong')
      if (optShown) addScore(pri, 0) // options shown = no penalty
      else { addScore(pri, -10); setBadge({pts:10, color:'#EF4444', team:pri, negative:true}) }
      setPass(true)
      // Give pass team a fresh timer if options were shown
      if (optShown) { setTimeLeft(TIMER_SEC); setTimerOn(true) }
    } else {
      // Pass team also ran out — done
      setT2Res('wrong')
    }
  }, [timeLeft, t1Res, t2Res, pass, optShown, pri, oth])

  useEffect(() => {
    setOptShown(false); setT1Sel(null); setT2Sel(null)
    setT1Res(null); setT2Res(null); setPass(false); setReveal(false)
    setTimeLeft(TIMER_SEC); stopTimer(); setBadge(null); setFloaters([]); setHint(null)
    // Trigger question reveal animation
    setQReveal(false)
    const t = setTimeout(() => setQReveal(true), 60)
    return () => clearTimeout(t)
  }, [questionIndex])

  const heartbeat  = timerOn && timeLeft <= 5 && timeLeft > 0
  const danger     = timeLeft <= 10
  const curTeam  = pass ? oth : pri
  const curName  = curTeam===1 ? teams.team1 : teams.team2
  const bothWrong = t1Res==='wrong' && t2Res==='wrong'
  const isDone    = t1Res==='correct' || t2Res==='correct' || reveal

  const popScore = useCallback((pts, color, team) => {
    setBadge({pts, color, team, negative:false})
    setFloaters(Array.from({length:5},(_,i)=>({id:Date.now()+i, x:40+Math.random()*20, delay:i*0.1})))
    addScore(team, pts)
    recordCorrect(team)
  }, [addScore, recordCorrect])

  const judge = (correct) => {
    stopTimer()
    if (!pass) {
      setT1Res(correct?'correct':'wrong')
      if (correct) {
        popScore(20,'#FFD700',pri); markQuestionDone(questionIndex); if(markAnswered&&currentCategory)markAnswered(`r01_${currentCategory.id}`,questionIndex)
        sounds.correct()
      } else {
        addScore(pri, -10)
        setBadge({pts:10, color:'#EF4444', team:pri, negative:true})
        recordWrong(pri); sounds.wrong()
        setPass(true)
      }
    } else {
      setT2Res(correct?'correct':'wrong')
      if (correct) { popScore(5,'#5DCAA5',oth); markQuestionDone(questionIndex); if(markAnswered&&currentCategory)markAnswered(`r01_${currentCategory.id}`,questionIndex); sounds.correct() }
      else { recordWrong(oth); sounds.wrong() }
    }
  }

  const submit = () => {
    const sel = pass?t2Sel:t1Sel; if(sel===null)return; stopTimer()
    const ok = sel===q.answer
    if (!pass) {
      setT1Res(ok?'correct':'wrong')
      if(ok){popScore(10,'#FFA500',pri);markQuestionDone(questionIndex);if(markAnswered&&currentCategory)markAnswered(`r01_${currentCategory.id}`,questionIndex);sounds.correct()} else { recordWrong(pri); sounds.wrong(); setPass(true) }
    } else {
      setT2Res(ok?'correct':'wrong')
      if(ok){popScore(5,'#5DCAA5',oth);markQuestionDone(questionIndex);if(markAnswered&&currentCategory)markAnswered(`r01_${currentCategory.id}`,questionIndex);sounds.correct()} else { recordWrong(oth); sounds.wrong() }
    }
  }

  const getHint = async () => {
    if(hint||hintLoad)return; setHintLoad(true)
    try { const d=await api.getR01Hint(currentCategory.id,questionIndex); setHint({en:d.hint_en||'',kn:d.hint_kn||''}) }
    catch { setHint({en:'No hint.',kn:''}) }
    finally { setHintLoad(false) }
  }

  const optSty = (i) => {
    const b = {...S.opt}
    if (!pass&&optShown&&!t1Res&&i===t1Sel) return{...b,background:'rgba(255,215,0,0.09)',borderColor:'rgba(255,215,0,0.7)'}
    if (pass&&!t2Res&&i===t2Sel)            return{...b,background:'rgba(255,165,0,0.09)',borderColor:'rgba(255,165,0,0.7)'}
    if (t1Res==='wrong'&&i===t1Sel)         return{...b,...S.optW}
    if (t2Res==='wrong'&&i===t2Sel)         return{...b,...S.optW}
    if ((t1Res==='correct'&&i===t1Sel)||(t2Res==='correct'&&i===t2Sel)) return{...b,...S.optC}
    if (reveal&&i===q.answer)               return{...b,...S.optC}
    return b
  }
  const canPick = (optShown&&!t1Res&&!pass)||(pass&&!t2Res)
  const circ = 2*Math.PI*20

  return (
    <>
      {floaters.map(f=>(
        <div key={f.id} style={{position:'fixed',left:`${f.x}%`,bottom:'35%',zIndex:300,
          fontSize:20,fontWeight:900,fontFamily:"'Playfair Display',serif",
          color:badge?.color||'#FFD700',pointerEvents:'none',
          animation:'floatUp 1.4s ease forwards',animationDelay:`${f.delay}s`,opacity:0}}>
          {badge?.negative ? '-' : '+'}{badge?.pts}
        </div>
      ))}
      <div style={{...S.page, paddingLeft:164}}>
        {/* Top bar */}
        <div style={S.topBar}>
          <div>
            <button style={S.back} onClick={cancelCategory}>← Categories</button>
            <span style={S.catLabel}>{currentCategory?.label} <span style={{fontSize:13,color:'rgba(255,255,255,0.25)',fontFamily:'Inter,sans-serif'}}>Q{questionIndex+1}/{questions.length}</span></span>
          </div>
          {/* Timer */}
          <div style={{...S.timerWrap,borderColor:heartbeat?'#EF4444':danger?'rgba(239,68,68,0.5)':timerOn?'rgba(255,215,0,0.45)':'rgba(255,215,0,0.15)',animation:heartbeat?'timerHeartbeat 1s ease-in-out infinite':timerOn?(danger?'timerDanger 0.8s ease-in-out infinite':'timerPulse 2s ease-in-out infinite'):'none',boxShadow:heartbeat?'0 0 0 4px rgba(239,68,68,0.15),0 0 20px rgba(239,68,68,0.3)':'none'}}>
            <svg style={S.timerSvg} viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,215,0,0.07)" strokeWidth="2.5"/>
              <circle cx="24" cy="24" r="20" fill="none" stroke={heartbeat?'#EF4444':danger?'#EF4444':'#FFD700'} strokeWidth={heartbeat?'3.5':'2.5'} strokeLinecap="round"
                strokeDasharray={`${(timeLeft/TIMER_SEC)*circ} ${circ}`} strokeDashoffset={circ*0.25} transform="rotate(-90 24 24)"
                style={{transition:'stroke-dasharray 1s linear,stroke 0.4s ease,stroke-width 0.3s ease'}}/>
            </svg>
            <div style={{...S.timerNum,color:heartbeat?'#EF4444':danger?'#EF4444':'#FFD700'}}>{String(timeLeft).padStart(2,'0')}</div>
            <div style={S.timerSec}>SEC</div>
          </div>
        </div>

        {/* Team chip */}
        <div style={{display:'flex',justifyContent:'center'}}>
          <div style={{...S.chip,borderColor:curTeam===1?'rgba(255,215,0,0.45)':'rgba(255,165,0,0.45)'}}>
            {pass&&<span style={S.passTag}>⚡ PASS →</span>}
            <span style={{color:curTeam===1?'#FFD700':'#FFA500',fontWeight:700}}>{curName}</span>
            <span style={{color:'rgba(255,255,255,0.3)'}}>'s Turn</span>
          </div>
        </div>

        {/* Question card */}
        <div style={{...S.card, animation: qReveal ? 'questionReveal 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none', opacity: qReveal ? undefined : 0}} className="glass-card">
          {/* English question */}
          <div style={{...S.qEn, animation: qReveal ? 'questionTextSlide 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both' : 'none'}}>{q.question_en}</div>
          {/* Kannada question — always shown below */}
          {q.question_kn && <div style={{...S.qKn, animation: qReveal ? 'questionTextSlide 0.5s cubic-bezier(0.22,1,0.36,1) 0.2s both' : 'none'}}>{q.question_kn}</div>}

          {/* Verbal judge */}
          {(!optShown||(pass&&!optShown))&&!isDone&&(
            <div style={S.judgeWrap}>
              <div style={S.judgeTitle}>Was <strong style={{color:curTeam===1?'#FFD700':'#FFA500'}}>{curName}</strong>'s verbal answer correct?</div>
              <div style={{display:'flex',gap:12}}>
                <button style={S.btnC} onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.08)'} onClick={()=>judge(true)}>✓ Correct</button>
                <button style={S.btnW} onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'} onClick={()=>judge(false)}>✕ Wrong</button>
              </div>
            </div>
          )}

          {/* Options — EN + KN both */}
          {optShown&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {q.options_en.map((_,i)=>(
                <button key={i} style={{...optSty(i),animation:'optionSlideIn 0.35s ease forwards',animationDelay:`${i*0.07}s`,opacity:0,animationFillMode:'forwards',cursor:canPick?'pointer':'default'}}
                  onClick={()=>{if(!canPick)return;pass?setT2Sel(i):setT1Sel(i)}}
                  onMouseEnter={e=>{if(!canPick)return;e.currentTarget.style.borderColor=curTeam===1?'rgba(255,215,0,0.7)':'rgba(255,165,0,0.7)';e.currentTarget.style.transform='translateX(4px)'}}
                  onMouseLeave={e=>{if(!canPick)return;e.currentTarget.style.borderColor=optSty(i).borderColor||'rgba(255,255,255,0.09)';e.currentTarget.style.transform='translateX(0)'}}>
                  <span style={S.optLetter}>{['A','B','C','D'][i]}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,color:'#E8E8E8',lineHeight:1.4}}>{q.options_en[i]}</div>
                    {q.options_kn?.[i]&&<div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:3,lineHeight:1.4}}>{q.options_kn[i]}</div>}
                  </div>
                  {((t1Res==='correct'&&i===t1Sel)||(t2Res==='correct'&&i===t2Sel)||(reveal&&i===q.answer))&&<span style={{color:'#22C55E',fontSize:16,animation:'scorePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>✓</span>}
                  {((t1Res==='wrong'&&i===t1Sel)||(t2Res==='wrong'&&i===t2Sel))&&<span style={{color:'#EF4444',fontSize:16}}>✕</span>}
                </button>
              ))}
            </div>
          )}

          {/* Score badge */}
          {badge&&(
            <div style={{alignSelf:'flex-start',border:`1.5px solid ${badge.color}55`,borderRadius:9999,padding:'10px 28px',display:'flex',flexDirection:'column',alignItems:'center',background:`${badge.color}12`,color:badge.color,animation:'scorePop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900}}>{badge.negative ? '-' : '+'}{badge.pts}</span>
              <span style={{fontSize:10,opacity:0.5,letterSpacing:1}}>{badge.team===1?teams.team1:teams.team2}</span>
            </div>
          )}

          {/* Reveal */}
          {reveal&&(
            <div style={{background:'rgba(34,197,94,0.07)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:12,padding:'14px 22px',textAlign:'center'}} className="scale-in">
              <div style={{fontSize:14,color:'rgba(255,255,255,0.5)'}}>Correct Answer: <strong style={{color:'#22C55E'}}>{q.options_en[q.answer]}</strong></div>
              {q.options_kn?.[q.answer]&&<div style={{fontSize:12,color:'rgba(34,197,94,0.6)',marginTop:4}}>{q.options_kn[q.answer]}</div>}
            </div>
          )}

          {/* Hint — EN + KN */}
          {hint&&(
            <div style={{display:'flex',gap:12,background:'rgba(239,159,39,0.08)',border:'1px solid rgba(239,159,39,0.28)',borderRadius:14,padding:'16px 20px',backdropFilter:'blur(10px)',animation:'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>
              <span style={{fontSize:18,flexShrink:0}}>💡</span>
              <div>
                {hint.en&&<div style={{fontSize:14,color:'rgba(239,159,39,0.9)',lineHeight:1.65,fontFamily:'Inter,sans-serif'}}>{hint.en}</div>}
                {hint.kn&&<div style={{fontSize:12,color:'rgba(239,159,39,0.6)',lineHeight:1.6,marginTop:6,fontFamily:'Inter,sans-serif'}}>{hint.kn}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center',width:'100%',maxWidth:860}}>
          {!optShown&&!isDone&&<AB color="#FFD700" label="Show Options" sub="Reveal all 4 · starts timer" onClick={()=>{setOptShown(true);setTimeLeft(TIMER_SEC);setTimerOn(true)}}/>}
          {optShown&&!isDone&&<AB color="#FFD700" label="Submit / Check" sub="Lock in answer" onClick={submit} disabled={pass?t2Sel===null:t1Sel===null}/>}
          {!hint&&!isDone&&<AB color="#EF9F27" label={hintLoad?'Loading…':'Show Hint'} sub="EN + KN hint" onClick={getHint} disabled={hintLoad}/>}
          {bothWrong&&!reveal&&<AB color="#5DCAA5" label="Show Answer" sub="Reveal correct option" onClick={()=>setReveal(true)}/>}
          {isDone&&<AB color="#AFA9EC" label="Next Question" sub={questionIndex+1>=questions.length?'Back to categories':`Q${questionIndex+2} →`} onClick={()=>{markQuestionDone(questionIndex);if(questionIndex+1>=questions.length)finishCategory(currentCategory?.id);else nextQuestion()}}/>}
        </div>
      </div>
    </>
  )
}

function AB({color,label,sub,onClick,disabled}){
  return(
    <button style={{background:'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))',backdropFilter:'blur(20px)',border:`1px solid ${disabled?'rgba(255,255,255,0.04)':`${color}35`}`,borderRadius:16,padding:'16px 28px',display:'flex',flexDirection:'column',alignItems:'center',gap:4,minWidth:160,opacity:disabled?0.35:1,cursor:disabled?'not-allowed':'pointer',transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)'}}
      onClick={disabled?undefined:onClick}
      onMouseEnter={e=>{if(disabled)return;e.currentTarget.style.borderColor=color;e.currentTarget.style.transform='translateY(-3px) scale(1.02)'}}
      onMouseLeave={e=>{if(disabled)return;e.currentTarget.style.borderColor=`${color}35`;e.currentTarget.style.transform='translateY(0) scale(1)'}}>
      <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color}}>{label}</span>
      <span style={{fontSize:10,letterSpacing:1,color:'rgba(255,255,255,0.25)',fontFamily:'Inter,sans-serif'}}>{sub}</span>
    </button>
  )
}

function Stat({msg,color='rgba(255,215,0,0.4)'}){
  return<div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Playfair Display',serif",color,fontSize:16,letterSpacing:2,textAlign:'center',maxWidth:400,padding:24}}>{msg}</div></div>
}

const S={
  page:{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column',alignItems:'center',padding:'72px 24px 40px',gap:18,position:'relative'},
  topBar:{width:'100%',maxWidth:860,display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8},
  back:{background:'none',border:'none',color:'rgba(255,215,0,0.28)',fontSize:12,letterSpacing:1,cursor:'pointer',fontFamily:'Inter,sans-serif',padding:0},
  catLabel:{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#FFD700',marginLeft:8},
  timerWrap:{position:'relative',width:76,height:76,borderRadius:'50%',border:'2px solid',background:'rgba(18,18,34,0.7)',backdropFilter:'blur(20px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',transition:'border-color 0.3s ease'},
  timerSvg:{position:'absolute',inset:-3,width:'calc(100% + 6px)',height:'calc(100% + 6px)',pointerEvents:'none'},
  timerNum:{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,lineHeight:1,zIndex:1},
  timerSec:{fontSize:8,letterSpacing:2,color:'rgba(255,255,255,0.3)',fontFamily:'Inter,sans-serif',zIndex:1},
  chip:{border:'1.5px solid',borderRadius:9999,padding:'9px 32px',fontFamily:"'Playfair Display',serif",fontSize:15,display:'flex',alignItems:'center',gap:10,background:'rgba(14,14,26,0.8)',backdropFilter:'blur(20px)'},
  passTag:{fontSize:10,letterSpacing:2,color:'#FFA500',fontFamily:'Inter,sans-serif',opacity:0.8},
  card:{width:'100%',maxWidth:860,padding:'36px 44px',display:'flex',flexDirection:'column',gap:20},
  qEn:{fontFamily:"'Playfair Display',serif",fontSize:21,fontWeight:700,color:'#F5F5F5',lineHeight:1.65},
  qKn:{fontFamily:'sans-serif',fontSize:16,color:'rgba(255,255,255,0.5)',lineHeight:1.7,paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.07)',marginTop:0},
  judgeWrap:{display:'flex',flexDirection:'column',gap:12},
  judgeTitle:{fontSize:13,color:'rgba(255,255,255,0.35)',fontFamily:'Inter,sans-serif'},
  btnC:{flex:1,padding:'18px',borderRadius:16,cursor:'pointer',fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,border:'1.5px solid rgba(34,197,94,0.4)',background:'rgba(34,197,94,0.08)',color:'#22C55E',transition:'background 0.2s',backdropFilter:'blur(10px)'},
  btnW:{flex:1,padding:'18px',borderRadius:16,cursor:'pointer',fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,border:'1.5px solid rgba(239,68,68,0.4)',background:'rgba(239,68,68,0.08)',color:'#EF4444',transition:'background 0.2s',backdropFilter:'blur(10px)'},
  opt:{background:'rgba(255,255,255,0.04)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'flex-start',gap:14,textAlign:'left',transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)'},
  optC:{background:'rgba(34,197,94,0.12)',borderColor:'rgba(34,197,94,0.6)',boxShadow:'0 0 28px rgba(34,197,94,0.2)',animation:'correctPulse 0.7s ease forwards'},
  optW:{background:'rgba(239,68,68,0.12)',borderColor:'rgba(239,68,68,0.6)',animation:'wrongShake 0.5s ease forwards'},
  optLetter:{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:900,opacity:0.35,flexShrink:0,width:20,paddingTop:2},
}
