import { useState, useEffect, useRef, useCallback } from 'react'
import { useGame } from '../context/GameContext'
import ScoreBar from '../components/common/ScoreBar'
import SaveButton from '../components/common/SaveButton'
import SubRoundLandingPage from './SubRoundLandingPage'
import { api } from '../services/api'
import { sounds } from '../utils/sounds'

const CATEGORIES = [
  { id:'gadegalu',    label:'Gade Mathu',       sub:'Kannada Proverbs',       kn:'ಗಾದೆ ಮಾತು',    color:'#C084FC', endpoint:'/round03/gadegalu',    type:'mcq'         },
  { id:'vagatugalu',  label:'Vagatu Vichar',     sub:'Lateral Riddles',        kn:'ವಗಟು ವಿಚಾರ',   color:'#A78BFA', endpoint:'/round03/vagatugalu',  type:'mcq'         },
  { id:'jumbled',     label:'Padagalu Thiruku',  sub:'Jumbled Words',          kn:'ಪದ ಅಡಗಿದ',     color:'#818CF8', endpoint:'/round03/jumbled',     type:'jumbled'     },
  { id:'songs',       label:'Sur Saga',          sub:'Song Identification',    kn:'ಸುರ ಸಾಗ',       color:'#E879F9', endpoint:'/round03/songs',       type:'songs'       },
  { id:'smartfunny',  label:'Hasi & Hushaar',    sub:'Smart Funny Questions',  kn:'ಹಾಸ್ಯ & ಹುಷಾರ', color:'#C084FC', endpoint:'/round03/smart-funny', type:'mcq'         },
  { id:'translation', label:'Nudi Bhavana',      sub:'English → Kannada',      kn:'ನುಡಿ ಭಾವನ',     color:'#A855F7', endpoint:'/round03/eng-kn',      type:'translation' },
]
const A = '#C084FC'
const TIMER = 30

export default function Round03PlayPage() {
  const { teams, addScore, tossWinner, setPhase, markRoundDone, completedR03Cats: completedCats, setCompletedR03Cats: setCompletedCats, markAnswered, getAnswered } = useGame()
  const [screen, setScreen]               = useState('catSelect')
  const [catLanding, setCatLanding]       = useState(false)
  const [selCat, setSelCat]               = useState(null)
  const [questions, setQuestions]         = useState([])
  const [qIdx, setQIdx]                   = useState(0)
  const [passPhase, setPassPhase]         = useState(false)
  const [t1Res, setT1Res]                 = useState(null)
  const [t2Res, setT2Res]                 = useState(null)
  const [selOpt, setSelOpt]               = useState(null)
  const [submitted, setSubmitted]         = useState(false)
  const [optShown, setOptShown]           = useState(false)
  const [hintShown, setHintShown]         = useState(false)
  const [timeLeft, setTimeLeft]           = useState(TIMER)
  const [timerOn, setTimerOn]             = useState(false)
  const [badge, setBadge]                 = useState(null)
  const timerRef = useRef(null)

  const firstTeam = tossWinner || 1
  const otherTeam = firstTeam === 1 ? 2 : 1
  const teamForQ  = qi => qi % 2 === 0 ? firstTeam : otherTeam
  const curTeam   = passPhase ? (teamForQ(qIdx)===1?2:1) : teamForQ(qIdx)
  const curName   = curTeam===1 ? teams.team1 : teams.team2
  const curColor  = curTeam===1 ? '#FFD700' : '#FFA500'

  useEffect(() => {
    if (!selCat) return
    setQuestions([])
    api.getR03Questions(selCat.endpoint)
      .then(d => setQuestions(d.questions || [])).catch(() => setQuestions([]))
  }, [selCat])

  const stopTimer = useCallback(() => { setTimerOn(false); clearInterval(timerRef.current) }, [])

  useEffect(() => {
    if (!timerOn) return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if(t<=1){ stopTimer(); sounds.timerEnd(); return 0 }
      if(t<=10) sounds.tick()
      return t-1
    }), 1000)
    return () => clearInterval(timerRef.current)
  }, [timerOn, stopTimer])

  const q      = questions[qIdx]
  const type   = selCat?.type
  const bothWrong = t1Res==='wrong' && t2Res==='wrong'
  const isDone    = t1Res==='correct' || t2Res==='correct' || bothWrong

  // Auto-pass on timer expiry
  useEffect(() => {
    if (timeLeft !== 0 || isDone) return
    if (!passPhase) {
      setT1Res('wrong')
      setPassPhase(true)
      setTimeLeft(TIMER)
      const shouldRestart = selCat?.id !== 'smartfunny' || optShown
      setTimerOn(shouldRestart)
    } else {
      setT2Res('wrong')
    }
  }, [timeLeft, isDone, optShown, passPhase, selCat])

  // Restore qIdx when entering a category (resume from last unanswered)
  useEffect(() => {
    if (!selCat || !getAnswered) return
    const done = getAnswered(`r03_${selCat.id}`)
    if (done.size === 0) return
    let start = 0
    while (done.has(start) && start < 20) start++
    if (start > 0 && start < 20) setQIdx(Math.min(start, 19))
  }, [selCat?.id])

  // Reset state on question change
  useEffect(() => {
    if (screen !== 'play') return
    setPassPhase(false); setT1Res(null); setT2Res(null); setSelOpt(null)
    setSubmitted(false); setOptShown(false); setHintShown(false)
    setTimeLeft(TIMER); setBadge(null)
    // Auto-start for gadegalu/vagatugalu (verbal); smartfunny waits for Show Options
    const shouldAutoStart = selCat?.id !== 'smartfunny'
    setTimerOn(shouldAutoStart)
  }, [qIdx, selCat, screen])

  const judge = (correct) => {
    stopTimer()
    if (!passPhase) {
      setT1Res(correct ? 'correct' : 'wrong')
      if (correct) { addScore(teamForQ(qIdx), 10); setBadge({pts:10, team:teamForQ(qIdx)}); sounds.correct() }
      else { setPassPhase(true); sounds.wrong(); const restart = selCat?.id !== 'smartfunny' || optShown; setTimeLeft(TIMER); if(restart) setTimerOn(true) }
    } else {
      setT2Res(correct ? 'correct' : 'wrong')
      const pt = teamForQ(qIdx)===1 ? 2 : 1
      if (correct) { addScore(pt, 5); setBadge({pts:5, team:pt}); sounds.correct() }
      else sounds.wrong()
    }
  }

  const submitMCQ = () => {
    if (selOpt===null) return; stopTimer(); setSubmitted(true)
    const ok = selOpt === q.answer
    if (!passPhase) {
      setT1Res(ok ? 'correct' : 'wrong')
      if(ok){ addScore(teamForQ(qIdx), 10); setBadge({pts:10, team:teamForQ(qIdx)}); sounds.correct() }
      else { setPassPhase(true); sounds.wrong(); setSelOpt(null); setSubmitted(false); setTimeLeft(TIMER); setTimerOn(true) }
    } else {
      setT2Res(ok ? 'correct' : 'wrong')
      if(ok){ addScore(teamForQ(qIdx)===1?2:1, 5); setBadge({pts:5, team:teamForQ(qIdx)===1?2:1}); sounds.correct() }
      else sounds.wrong()
    }
  }

  const handleNext = () => {
    const total = questions.length || 20
    if (qIdx+1 >= total) { setCompletedCats(p => new Set([...p, selCat.id])); setScreen('catSelect'); setSelCat(null); setQuestions([]) }
    else setQIdx(i => i+1)
  }

  // ── Option style — matches Round01 exactly ────────────────────
  const optSty = (i) => {
    const base = { ...S.opt }
    if (!submitted && optShown && !t1Res && i===selOpt && !passPhase) return {...base, background:`${catColor}12`, borderColor:catColor}
    if (passPhase && !t2Res && i===selOpt)   return {...base, background:`${catColor}09`, borderColor:catColor}
    if ((t1Res==='wrong'||t2Res==='wrong') && i===selOpt && !(t1Res==='correct'||t2Res==='correct')) return {...base, ...S.optW}
    if ((t1Res==='correct' && i===selOpt) || (t2Res==='correct' && i===selOpt)) return {...base, ...S.optC}
    if (bothWrong && i===q.answer) return {...base, ...S.optC}
    return base
  }

  const circ     = 2*Math.PI*20
  const danger   = timeLeft<=10
  const catColor = selCat?.color || A

  // ── Category Select ───────────────────────────────────────────
  const R03_TAGLINES = {
    gadegalu:    'ಗಾದೆ ಮಾತಿಗೆ ಉತ್ತರ ಕೊಡಿ. Ancient wisdom in proverb form.',
    vagatugalu:  'Think sideways. Lateral riddles that twist your mind.',
    jumbled:     'Letters in chaos. Unscramble the hidden Kannada word.',
    songs:       'Melody meets memory. Name the song from its lyrics.',
    smartfunny:  'Smart questions. Funny answers. Expect the unexpected.',
    translation: 'Bridge two languages. Translate English into Kannada.',
  }
  const R03_ICONS = { gadegalu:'📜', vagatugalu:'🌀', jumbled:'🔀', songs:'🎵', smartfunny:'😄', translation:'🌐' }

  if (catLanding && selCat) {
    return (
      <SubRoundLandingPage
        accent={selCat.color}
        tag={`ROUND 03 · ${selCat.sub.toUpperCase()}`}
        title={selCat.label}
        titleKn={selCat.kn}
        sub={selCat.sub}
        tagline={R03_TAGLINES[selCat.id] || '20 questions · wild card format'}
        icon={R03_ICONS[selCat.id] || '🃏'}
        backLabel="← Sub-Categories"
        onBack={() => { setCatLanding(false); setSelCat(null) }}
        onContinue={() => { setCatLanding(false); setQIdx(0); setScreen('play') }}
      />
    )
  }

  if (screen === 'catSelect') return (
    <>
      <ScoreBar />
      <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',padding:'72px 24px 48px',position:'relative'}}>
        {['tl','tr','bl','br'].map(p=><div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:A}}/>)}
        <div style={{width:'100%',maxWidth:920,display:'flex',flexDirection:'column',gap:28}} className="fade-in">

          {/* Header */}
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
            <button style={{alignSelf:'flex-start',background:'none',border:'none',color:`${A}55`,fontSize:12,letterSpacing:1,cursor:'pointer',fontFamily:'Inter,sans-serif',padding:0}} onClick={()=>setPhase('roundSelect')}>← All Rounds</button>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:4,color:`${A}66`,fontFamily:'Inter,sans-serif'}}>ROUND 03 · THE WILD CARD</div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,color:A,textAlign:'center'}}>Choose Your Wild Card</h1>
            <div style={{width:80,height:1,background:`linear-gradient(90deg,transparent,${A},transparent)`,margin:'4px 0 8px'}}/>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.35)',fontFamily:'Inter,sans-serif',textAlign:'center',maxWidth:500}}>
              Six sub-categories · Each with a different format · Smart, funny and confusing questions
            </p>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.2)',fontFamily:'Inter,sans-serif'}}>
              {completedCats.size} of {CATEGORIES.length} completed
            </div>
          </div>

          {/* Sub-category grid — 3 columns, 2 rows */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {CATEGORIES.map(cat => {
              const done = completedCats.has(cat.id)
              return (
                <button key={cat.id}
                  style={{
                    position:'relative',overflow:'hidden',
                    borderRadius:20,padding:'28px 20px 22px',
                    border:`1px solid ${done?'rgba(34,197,94,0.35)':`${cat.color}20`}`,
                    background:done
                      ? 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.03))'
                      : 'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))',
                    display:'flex',flexDirection:'column',alignItems:'center',gap:8,textAlign:'center',
                    cursor:done?'default':'pointer',
                    backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
                    transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                    outline:'none',
                  }}
                  onClick={()=>{ if(done) return; setSelCat(cat); setCatLanding(true) }}
                  onMouseEnter={e=>{ if(!done){ e.currentTarget.style.borderColor=cat.color; e.currentTarget.style.transform='translateY(-5px) scale(1.02)'; e.currentTarget.style.boxShadow=`0 16px 40px ${cat.color}20` }}}
                  onMouseLeave={e=>{ if(!done){ e.currentTarget.style.borderColor=`${cat.color}20`; e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.boxShadow='none' }}}>
                  {done&&<div style={{position:'absolute',top:10,right:10,width:22,height:22,borderRadius:'50%',background:'#22C55E',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:700,animation:'checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>✓</div>}
                  <div style={{fontSize:30,filter:done?'grayscale(0.4)':'none'}}>{cat.icon}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:done?'rgba(34,197,94,0.85)':'#F0F0F0',lineHeight:1.2}}>{cat.label}</div>
                  <div style={{fontSize:13,color:done?'rgba(34,197,94,0.6)':`${cat.color}99`,fontFamily:'sans-serif'}}>{cat.kn}</div>
                  <div style={{fontSize:11,color:done?'rgba(34,197,94,0.5)':`${cat.color}66`,fontFamily:'Inter,sans-serif',letterSpacing:1}}>{done?'Completed ✓':cat.sub}</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.15)',fontFamily:'Inter,sans-serif'}}>20 questions</div>
                  {!done&&<div style={{position:'absolute',bottom:0,left:14,right:14,height:2,borderRadius:1,background:`linear-gradient(90deg,transparent,${cat.color}40,transparent)`,transition:'opacity 0.3s ease'}}/>}
                </button>
              )
            })}
          </div>

          <div style={{display:'flex',justifyContent:'center',marginBottom:8}}>
            <SaveButton />
          </div>
    {completedCats.size>=CATEGORIES.length && (
            <div style={{textAlign:'center',animation:'fadeUp 0.5s ease forwards',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
              <button className="btn-gold" style={{borderColor:`${A}55`,color:A}} onClick={()=>{markRoundDone(3);setPhase('roundSelect')}}>
                ✓ Round Complete — Back to Rounds
              </button>
              <SaveButton />
            </div>
          )}
          {completedCats.size>0 && completedCats.size<CATEGORIES.length && (
            <div style={{display:'flex',justifyContent:'center'}}>
              <SaveButton />
            </div>
          )}
        </div>
      </div>
    </>
  )

  // ── Play screen ───────────────────────────────────────────────
  return (
    <>
      <ScoreBar />
      <div style={{...S.page, background:'var(--bg-primary)', justifyContent:'flex-start', paddingTop:80}}>
        <div style={{width:'100%',maxWidth:860,display:'flex',flexDirection:'column',gap:18}}>

          {/* Top bar */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <button style={{background:'none',border:'none',color:`${catColor}55`,fontSize:12,letterSpacing:1,cursor:'pointer',fontFamily:'Inter,sans-serif',padding:0}}
                onClick={()=>{ stopTimer(); setScreen('catSelect') }}>← Categories</button>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:catColor,marginTop:4}}>
                {selCat?.label} <span style={{fontSize:12,color:'rgba(255,255,255,0.25)',fontFamily:'Inter,sans-serif'}}>Q{qIdx+1}/{questions.length}</span>
              </div>
            </div>

            {/* Timer */}
            <div style={{...S.timerWrap, borderColor:danger?'rgba(239,68,68,0.5)':timerOn?`${catColor}55`:`${catColor}22`, animation:timerOn?(danger?'timerDanger 0.8s ease-in-out infinite':'timerPulse 2s ease-in-out infinite'):'none'}}>
                <svg style={S.timerSvg} viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke={`${catColor}10`} strokeWidth="2.5"/>
                  <circle cx="24" cy="24" r="20" fill="none" stroke={danger?'#EF4444':catColor} strokeWidth="2.5" strokeLinecap="round"
                    strokeDasharray={`${(timeLeft/TIMER)*circ} ${circ}`} strokeDashoffset={circ*0.25} transform="rotate(-90 24 24)"
                    style={{transition:'stroke-dasharray 1s linear'}}/>
                </svg>
                <div style={{...S.timerNum, color:danger?'#EF4444':catColor}}>{String(timeLeft).padStart(2,'0')}</div>
                <div style={S.timerSec}>SEC</div>
              </div>
          </div>

          {/* Team chip */}
          <div style={{display:'flex',justifyContent:'center'}}>
            <div style={{border:`1.5px solid ${curColor}45`,borderRadius:9999,padding:'9px 32px',fontFamily:"'Playfair Display',serif",fontSize:15,display:'flex',alignItems:'center',gap:10,background:'rgba(14,14,26,0.8)',backdropFilter:'blur(20px)'}}>
              {passPhase && <span style={{fontSize:10,letterSpacing:2,color:'#FFA500',fontFamily:'Inter,sans-serif',opacity:0.8}}>⚡ PASS →</span>}
              <span style={{color:curColor,fontWeight:700}}>{curName}</span>
              <span style={{color:'rgba(255,255,255,0.3)'}}>'s Turn</span>
            </div>
          </div>

          {q ? (
            <div style={S.qCard} className="glass-card">

              {/* ── MCQ (gadegalu, vagatugalu, smartfunny) ── */}
              {type==='mcq' && (<>
                {q.question_en
                  ? <div style={S.qEn}>{q.question_en}</div>
                  : <div style={{...S.qEn,fontSize:18}}>{q.question_kn}</div>
                }
                {q.question_kn && q.question_en && <div style={S.qKn}>{q.question_kn}</div>}

                {/* Show Options */}
                {!optShown && !isDone && selCat?.id === 'smartfunny' && (
                  <button style={S.showOptBtn}
                    onClick={()=>{ setOptShown(true); setTimeLeft(TIMER); setTimerOn(true) }}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:catColor}}>Show Options</span>
                    <span style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'Inter,sans-serif'}}>starts 30s timer</span>
                  </button>
                )}

                {/* Options grid — Round01 style */}
                {optShown && (
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    {(q.options_en||[]).map((opt,i) => {
                      const kn = q.options_kn?.[i] || ''
                      const canPick = (optShown && !t1Res && !passPhase) || (passPhase && !t2Res)
                      return (
                        <button key={i}
                          style={{...optSty(i), animation:'optionSlideIn 0.35s ease forwards', animationDelay:`${i*0.07}s`, opacity:0, animationFillMode:'forwards', cursor:canPick?'pointer':'default'}}
                          onClick={()=>{ if(!canPick||submitted) return; setSelOpt(i) }}
                          onMouseEnter={e=>{ if(!canPick||submitted) return; e.currentTarget.style.borderColor=curColor; e.currentTarget.style.transform='translateX(4px)' }}
                          onMouseLeave={e=>{ if(!canPick||submitted) return; e.currentTarget.style.borderColor=optSty(i).borderColor||'rgba(255,255,255,0.09)'; e.currentTarget.style.transform='translateX(0)' }}>
                          <span style={S.optLetter}>{['A','B','C','D'][i]}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:15,color:'#E8E8E8',lineHeight:1.4}}>{opt}</div>
                            {kn && <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:3,lineHeight:1.4}}>{kn}</div>}
                          </div>
                          {((t1Res==='correct'&&i===selOpt)||(t2Res==='correct'&&i===selOpt)||(bothWrong&&i===q.answer)) && <span style={{color:'#22C55E',fontSize:16,animation:'scorePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>✓</span>}
                          {((t1Res==='wrong'&&i===selOpt&&!passPhase)||(t2Res==='wrong'&&i===selOpt&&passPhase)) && <span style={{color:'#EF4444',fontSize:16}}>✕</span>}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Hint */}
                {!isDone && (
                  !hintShown
                    ? <button style={S.hintToggle} onClick={()=>setHintShown(true)}>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700}}>💡 Show Hint</span>
                      </button>
                    : (q.hint_en||q.hint_kn) && <div style={S.hintBox}>
                        <span style={{fontSize:18,flexShrink:0}}>💡</span>
                        <div>
                          {q.hint_en && <div style={S.hintEn}>{q.hint_en}</div>}
                          {q.hint_kn && <div style={S.hintKn}>{q.hint_kn}</div>}
                        </div>
                      </div>
                )}

                {/* Score badge */}
                {badge && <ScoreBadge badge={badge} teams={teams} />}

                {/* Verbal judge + submit */}
                {!submitted && !isDone && (
                  <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                    <button style={S.btnC} onClick={()=>judge(true)}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.18)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.08)'}>✓ Correct (+{passPhase?5:10})</button>
                    <button style={S.btnW} onClick={()=>judge(false)}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.18)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'}>✕ Wrong</button>
                    {optShown && selOpt!==null && (
                      <button style={{...S.submitOptBtn, borderColor:`${catColor}55`, color:catColor}} onClick={submitMCQ}>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700}}>Submit Option</span>
                      </button>
                    )}
                  </div>
                )}
              </>)}

              {/* ── Jumbled ── */}
              {type==='jumbled' && (<>
                <div style={S.typeLabel}>Unjumble this word</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,color:catColor,letterSpacing:6,textAlign:'center',padding:'20px 0'}}>{q.jumbled}</div>
                {q.hint_en && <div style={S.hintBox}><span style={{fontSize:16,flexShrink:0}}>💡</span><div style={S.hintEn}>{q.hint_en}</div></div>}
                {badge && <ScoreBadge badge={badge} teams={teams} />}
                {isDone
                  ? <div style={S.answerBox}>Answer: <strong style={{color:'#22C55E',fontSize:18,marginLeft:8}}>{q.answer}</strong></div>
                  : <div style={{display:'flex',gap:12}}>
                      <button style={S.btnC}
                      onClick={()=>{stopTimer();setT1Res('correct');addScore(teamForQ(qIdx),10);setBadge({pts:10,team:teamForQ(qIdx)});if(markAnswered&&selCat)markAnswered(`r03_${selCat.id}`,qIdx)}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.18)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.08)'}>✓ Correct (+10)</button>
                      <button style={S.btnW}
                      onClick={()=>{stopTimer();setT2Res('wrong')}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.18)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'}>✕ Wrong (0 pts)</button>
                    </div>
                }
              </>)}

              {/* ── Songs ── */}
              {type==='songs' && (<>
                <div style={S.typeLabel}>Guess the Song · ಹಾಡಿನ ಹೆಸರು ಹೇಳಿ</div>
                {/* Lyrics shown as clue */}
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:600,color:'#F0F0F0',lineHeight:1.9,fontStyle:'italic',padding:'18px 22px',borderLeft:`4px solid ${catColor}`,background:`${catColor}08`,borderRadius:'0 14px 14px 0'}}>
                  {q.question_kn || q.question_en || '—'}
                </div>
                {/* Hint */}
                {q.hint_en && <div style={S.hintBox}><span style={{fontSize:16,flexShrink:0}}>💡</span><div style={S.hintEn}>{q.hint_en}</div></div>}
                {badge && <ScoreBadge badge={badge} teams={teams} />}
                {isDone
                  ? <div style={{...S.answerBox,fontSize:15}}>🎵 ಹಾಡು: <strong style={{color:'#22C55E',fontSize:17,marginLeft:8}}>{q.answer_en||'—'}</strong></div>
                  : <div style={{display:'flex',gap:12}}>
                      <button style={S.btnC}
                      onClick={()=>judge(true)}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.18)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.08)'}>✓ Correct (+{passPhase?5:10})</button>
                      <button style={S.btnW}
                      onClick={()=>judge(false)}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.18)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'}>✕ Wrong</button>
                    </div>
                }
              </>)}

              {/* ── Translation ── */}
              {type==='translation' && (<>
                <div style={S.typeLabel}>Translate to Kannada</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:600,color:'#F0F0F0',lineHeight:1.8,padding:'14px 18px',borderLeft:`3px solid ${catColor}`,background:'rgba(255,255,255,0.04)',borderRadius:'0 12px 12px 0',fontStyle:'italic'}}>{q.question_en}</div>
                {badge && <ScoreBadge badge={badge} teams={teams} />}
                {isDone
                  ? <div style={S.answerBox}>ಕನ್ನಡ: <strong style={{color:'#22C55E',fontSize:16,marginLeft:8}}>{q.answer_kn}</strong></div>
                  : <div style={{display:'flex',gap:12}}>
                      <button style={S.btnC}
                      onClick={()=>{stopTimer();setT1Res('correct');addScore(teamForQ(qIdx),10);setBadge({pts:10,team:teamForQ(qIdx)});if(markAnswered&&selCat)markAnswered(`r03_${selCat.id}`,qIdx)}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.18)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.08)'}>✓ Correct (+10)</button>
                      <button style={S.btnW}
                      onClick={()=>{stopTimer();setT2Res('wrong')}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.18)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'}>✕ Wrong (0 pts)</button>
                    </div>
                }
              </>)}

            </div>
          ) : <div style={{textAlign:'center',color:'rgba(255,255,255,0.2)',padding:40}}>Loading...</div>}

          {isDone && (
            <div style={{display:'flex',justifyContent:'center'}}>
              <button style={{...S.nextBtn, borderColor:`${catColor}45`, color:catColor}} onClick={handleNext}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=catColor; e.currentTarget.style.transform='translateY(-3px) scale(1.02)' }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=`${catColor}45`; e.currentTarget.style.transform='translateY(0) scale(1)' }}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700}}>
                  {qIdx+1>=(questions.length||20) ? 'Back to Categories' : 'Next Question →'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Shared score badge ────────────────────────────────────────────
function ScoreBadge({ badge, teams }) {
  const color = badge.team===1 ? '#FFD700' : '#FFA500'
  return (
    <div style={{alignSelf:'flex-start',border:`1.5px solid ${color}55`,borderRadius:9999,padding:'10px 28px',background:`${color}10`,color,display:'flex',flexDirection:'column',alignItems:'center',animation:'scorePop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>
      <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900}}>+{badge.pts}</span>
      <span style={{fontSize:10,opacity:0.5}}>{badge.team===1?teams.team1:teams.team2}</span>
    </div>
  )
}

const S = {
  page:       { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px 40px', gap:20, position:'relative' },
  wrap:       { width:'100%', maxWidth:860, display:'flex', flexDirection:'column', gap:28 },
  catCard:    { borderRadius:16, padding:'22px 20px', border:'1px solid', display:'flex', flexDirection:'column', gap:4, textAlign:'left', transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', backdropFilter:'blur(16px)', cursor:'pointer' },
  backBtn:    { background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9999, padding:'10px 24px', color:'rgba(255,255,255,0.35)', fontSize:12, letterSpacing:1, cursor:'pointer', fontFamily:'Inter,sans-serif', alignSelf:'center' },
  timerWrap:  { position:'relative', width:76, height:76, borderRadius:'50%', border:'2px solid', background:'rgba(18,18,34,0.7)', backdropFilter:'blur(20px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', transition:'border-color 0.3s ease' },
  timerSvg:   { position:'absolute', inset:-3, width:'calc(100% + 6px)', height:'calc(100% + 6px)', pointerEvents:'none' },
  timerNum:   { fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, lineHeight:1, zIndex:1 },
  timerSec:   { fontSize:8, letterSpacing:2, color:'rgba(255,255,255,0.3)', fontFamily:'Inter,sans-serif', zIndex:1 },
  qCard:      { width:'100%', padding:'32px 36px', display:'flex', flexDirection:'column', gap:18 },
  qEn:        { fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'#F5F5F5', lineHeight:1.65 },
  qKn:        { fontSize:15, color:'rgba(255,255,255,0.45)', lineHeight:1.7, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.07)' },
  typeLabel:  { fontSize:11, letterSpacing:3, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', fontFamily:'Inter,sans-serif' },
  // Option styles — identical to Round01
  opt:        { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:14, textAlign:'left', transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)' },
  optC:       { background:'rgba(34,197,94,0.12)', borderColor:'rgba(34,197,94,0.6)', boxShadow:'0 0 28px rgba(34,197,94,0.2)', animation:'correctPulse 0.7s ease forwards' },
  optW:       { background:'rgba(239,68,68,0.12)', borderColor:'rgba(239,68,68,0.6)', animation:'wrongShake 0.5s ease forwards' },
  optLetter:  { fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:900, opacity:0.35, flexShrink:0, width:20, paddingTop:2 },
  showOptBtn: { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(16px)', border:'1px solid', borderRadius:12, padding:'10px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:2, cursor:'pointer', transition:'all 0.2s ease', alignSelf:'flex-start' },
  hintToggle: { background:'rgba(239,159,39,0.06)', border:'1px solid rgba(239,159,39,0.28)', borderRadius:12, padding:'10px 20px', display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:'#EF9F27', alignSelf:'flex-start', transition:'all 0.2s ease' },
  hintBox:    { display:'flex', gap:12, background:'rgba(239,159,39,0.08)', border:'1px solid rgba(239,159,39,0.28)', borderRadius:14, padding:'14px 18px' },
  hintEn:     { fontSize:13, color:'rgba(239,159,39,0.9)', lineHeight:1.6, fontFamily:'Inter,sans-serif' },
  hintKn:     { fontSize:11, color:'rgba(239,159,39,0.6)', lineHeight:1.6, marginTop:4, fontFamily:'Inter,sans-serif' },
  answerBox:  { background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:12, padding:'14px 20px', fontSize:14, color:'rgba(255,255,255,0.5)', textAlign:'center' },
  btnC:       { flex:1, padding:'16px', borderRadius:14, cursor:'pointer', fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, border:'1.5px solid rgba(34,197,94,0.4)', background:'rgba(34,197,94,0.08)', color:'#22C55E', transition:'background 0.2s' },
  btnW:       { flex:1, padding:'16px', borderRadius:14, cursor:'pointer', fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, border:'1.5px solid rgba(239,68,68,0.4)', background:'rgba(239,68,68,0.08)', color:'#EF4444', transition:'background 0.2s' },
  submitOptBtn:{ background:'rgba(255,255,255,0.04)', backdropFilter:'blur(16px)', border:'1px solid', borderRadius:12, padding:'10px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:2, cursor:'pointer', transition:'all 0.2s ease' },
  nextBtn:    { background:'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))', backdropFilter:'blur(20px)', border:'1.5px solid', borderRadius:16, padding:'16px 40px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer', transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)' },
}
