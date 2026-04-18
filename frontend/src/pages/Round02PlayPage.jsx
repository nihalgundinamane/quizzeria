import { useState, useEffect, useRef, useCallback } from 'react'
import { useGame } from '../context/GameContext'
import ScoreBar from '../components/common/ScoreBar'
import SaveButton from '../components/common/SaveButton'
import SubRoundLandingPage from './SubRoundLandingPage'
import { api } from '../services/api'
import { sounds } from '../utils/sounds'

const CATEGORIES = [
  { id:'logos',      label:'Chihn Grahana',    sub:'Brand Logos',       kn:'ಚಿಹ್ನೆ ಗ್ರಹಣ',    color:'#85B7EB' },
  { id:'animals',    label:'Vanya Darshana',    sub:'Wild Animals',      kn:'ವನ್ಯ ದರ್ಶನ',     color:'#5DCAA5' },
  { id:'actors',     label:'Nayaka Drushya',    sub:'Indian Artists',    kn:'ನಾಯಕ ದೃಶ್ಯ',     color:'#F87171' },
  { id:'gods',       label:'Devara Pratibimba', sub:'Gods & Deities',    kn:'ದೇವರ ಪ್ರತಿಬಿಂಬ', color:'#FCD34D' },
  { id:'cricketers', label:'Krida Veerana',     sub:'Indian Cricketers', kn:'ಕ್ರೀಡಾ ವೀರಾ',    color:'#86EFAC' },
]

const TIMER = 30
const A = '#85B7EB'

export default function Round02PlayPage() {
  const { teams, addScore, tossWinner, setPhase, markRoundDone, scores, completedR02Cats: completedCats, setCompletedR02Cats: setCompletedCats, markAnswered, getAnswered } = useGame()
  const [screen,        setScreen]        = useState('catSelect')
  const [catLanding,    setCatLanding]    = useState(false)
  const [selCat,        setSelCat]        = useState(null)
  const [questions,     setQuestions]     = useState([])
  const [loadErr,       setLoadErr]       = useState(null)
  const [qIdx,          setQIdx]          = useState(0)
  const [passPhase,     setPassPhase]     = useState(false)
  const [t1Res,         setT1Res]         = useState(null)
  const [t2Res,         setT2Res]         = useState(null)
  const [timeLeft,      setTimeLeft]      = useState(TIMER)
  const [timerOn,       setTimerOn]       = useState(false)
  const [badge,         setBadge]         = useState(null)
  const [revealed,      setRevealed]      = useState(false)
  const timerRef = useRef(null)

  const firstTeam = tossWinner || 1
  const otherTeam = firstTeam === 1 ? 2 : 1
  const teamForQ  = (qi) => qi % 2 === 0 ? firstTeam : otherTeam
  const curTeam   = passPhase ? (teamForQ(qIdx)===1?2:1) : teamForQ(qIdx)
  const curName   = curTeam===1 ? teams.team1 : teams.team2
  const curColor  = curTeam===1 ? '#FFD700' : '#FFA500'

  // Load questions when category selected
  useEffect(() => {
    if (!selCat) return
    setLoadErr(null)
    api.getR02Questions(selCat.id)
      .then(d => setQuestions(d.questions || []))
      .catch(() => setLoadErr('Backend not reachable'))
  }, [selCat])

  // FIX B8: stopTimer wrapped in useCallback — no stale closure
  const stopTimer = useCallback(() => {
    setTimerOn(false)
    clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (!timerOn) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if(t<=1){ stopTimer(); sounds.timerEnd(); return 0 }
        if(t<=10) sounds.tick()
        return t-1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerOn, stopTimer])

  // FIX B4: Simplified isDone/canNext logic — clean bothWrong path, no early reveal
  const bothWrong = t1Res === 'wrong' && t2Res === 'wrong'
  const isDone    = t1Res === 'correct' || t2Res === 'correct' || bothWrong
  const timedOut  = timeLeft === 0 && t2Res !== null

  // FIX B4: Auto-pass dep array includes bothWrong/isDone to prevent stale reads
  useEffect(() => {
    if (timeLeft !== 0 || isDone) return
    if (!passPhase) {
      setT1Res('wrong')
      setPassPhase(true)
      setTimeLeft(TIMER)
      setTimerOn(true)
    } else {
      setT2Res('wrong')
    }
  }, [timeLeft, isDone, passPhase])

  // Reset per question
  useEffect(() => {
    if (screen !== 'play') return
    setPassPhase(false); setT1Res(null); setT2Res(null)
    setTimeLeft(TIMER); setTimerOn(false); setBadge(null); setRevealed(false)
  }, [qIdx, selCat, screen])

  const judge = (correct) => {
    stopTimer()
    if (!passPhase) {
      setT1Res(correct ? 'correct' : 'wrong')
      if (correct) { addScore(teamForQ(qIdx), 10); setBadge({pts:10, team:teamForQ(qIdx)}); if(markAnswered&&selCat)markAnswered(`r02_${selCat.id}`,qIdx); sounds.correct() }
      else { setPassPhase(true); sounds.wrong() }
    } else {
      setT2Res(correct ? 'correct' : 'wrong')
      const pt = teamForQ(qIdx)===1 ? 2 : 1
      if (correct) { addScore(pt, 5); setBadge({pts:5, team:pt}); sounds.correct() }
      else sounds.wrong()
    }
  }

  const q = questions[qIdx]

  // canNext: either fully judged OR timed out with both teams resolved
  const canNext = isDone || timedOut

  const handleNext = () => {
    if (qIdx+1 >= 20) {
      setCompletedCats(prev => new Set([...prev, selCat.id]))
      setScreen('catSelect'); setSelCat(null); setQuestions([])
    } else setQIdx(i => i+1)
  }

  const circ   = 2*Math.PI*20
  const danger = timeLeft<=10

  // ── Category Select Landing Page ───────────────────────────────
  const R02_TAGLINES = {
    logos:      'Brands in shadow. Can you name them all?',
    animals:    'Wild creatures lurk in the silhouette. Name them.',
    actors:     'Faces from the silver screen. Who hides in the shadows?',
    gods:       'Divine forms from ancient myth. Recognise the sacred.',
    cricketers: 'Legends of the pitch in silhouette. Spot your champion.',
  }
  const R02_ICONS = { logos:'🏷️', animals:'🐆', actors:'🎬', gods:'🕉️', cricketers:'🏏' }

  // Cinematic landing for selected category
  if (catLanding && selCat) {
    return (
      <SubRoundLandingPage
        accent={selCat.color}
        tag={`ROUND 02 · ${selCat.sub.toUpperCase()}`}
        title={selCat.label}
        titleKn={selCat.kn}
        sub={selCat.sub}
        tagline={R02_TAGLINES[selCat.id] || '20 questions · shadow identification'}
        icon={R02_ICONS[selCat.id] || '👁'}
        backLabel="← Categories"
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
            <div style={{fontSize:10,fontWeight:700,letterSpacing:4,color:`${A}66`,fontFamily:'Inter,sans-serif'}}>ROUND 02 · THE VISUAL VAULT</div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,color:A,textAlign:'center'}}>Shadow Image Round</h1>
            <div style={{width:80,height:1,background:`linear-gradient(90deg,transparent,${A},transparent)`,margin:'4px 0 10px'}}/>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.35)',fontFamily:'Inter,sans-serif',textAlign:'center'}}>
              A shadow silhouette is revealed · Identify it in 30 seconds · No options
            </p>
            <div style={{display:'flex',gap:20,fontSize:12,fontFamily:'Inter,sans-serif',color:'rgba(255,255,255,0.25)'}}>
              <span style={{color:'#22C55E'}}>+10 correct</span>
              <span>·</span>
              <span style={{color:'#5DCAA5'}}>+5 on pass</span>
              <span>·</span>
              <span>No negative marking</span>
            </div>
          </div>

          {/* Category grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14}}>
            {CATEGORIES.map(cat => {
              const done = completedCats.has(cat.id)
              return (
                <button key={cat.id}
                  style={{
                    position:'relative',overflow:'hidden',
                    borderRadius:18,padding:'28px 16px 22px',
                    border:`1px solid ${done?'rgba(34,197,94,0.35)':`${cat.color}22`}`,
                    background: done
                      ? 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.03))'
                      : 'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))',
                    display:'flex',flexDirection:'column',alignItems:'center',gap:8,
                    cursor:done?'default':'pointer',
                    backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
                    transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                    outline:'none',
                  }}
                  onClick={()=>{ if(done)return; setSelCat(cat); setCatLanding(true) }}
                  onMouseEnter={e=>{if(!done){e.currentTarget.style.borderColor=cat.color;e.currentTarget.style.transform='translateY(-5px) scale(1.03)';e.currentTarget.style.boxShadow=`0 16px 40px ${cat.color}20`}}}
                  onMouseLeave={e=>{if(!done){e.currentTarget.style.borderColor=`${cat.color}22`;e.currentTarget.style.transform='translateY(0) scale(1)';e.currentTarget.style.boxShadow='none'}}}>
                  {done&&<div style={{position:'absolute',top:10,right:10,width:22,height:22,borderRadius:'50%',background:'#22C55E',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:700,animation:'checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>✓</div>}
                  <div style={{fontSize:32,filter:done?'grayscale(0.4)':'none'}}>{cat.icon}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:done?'rgba(34,197,94,0.8)':'#F0F0F0',textAlign:'center',lineHeight:1.2}}>{cat.label}</div>
                  <div style={{fontSize:12,color:done?'rgba(34,197,94,0.55)':`${cat.color}99`,fontFamily:'sans-serif'}}>{cat.kn}</div>
                  <div style={{fontSize:10,color:done?'rgba(34,197,94,0.5)':`${cat.color}55`,fontFamily:'Inter,sans-serif',letterSpacing:1,textTransform:'uppercase'}}>{done?'Completed ✓':cat.sub}</div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.15)',fontFamily:'Inter,sans-serif'}}>20 questions</div>
                  {!done&&<div style={{position:'absolute',bottom:0,left:12,right:12,height:2,borderRadius:1,background:`linear-gradient(90deg,transparent,${cat.color}33,transparent)`}}/>}
                </button>
              )
            })}
          </div>

          <div style={{display:'flex',justifyContent:'center'}}>
            <SaveButton />
          </div>

          {completedCats.size>=CATEGORIES.length&&(
            <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
              <button className="btn-gold" style={{borderColor:`${A}55`,color:A}} onClick={()=>{markRoundDone(2);setPhase('roundSelect')}}>
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

  // ── Play ──────────────────────────────────────────────────────
  return (
    <>
      <ScoreBar />
      <div style={{...S.page, background:'var(--bg-primary)', justifyContent:'flex-start', paddingTop:80}}>
        <div style={{width:'100%',maxWidth:860,display:'flex',flexDirection:'column',gap:18}}>

          {/* Top bar */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <button style={S.backBtnSm} onClick={()=>{ stopTimer(); setScreen('catSelect') }}>← Categories</button>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:A,marginTop:4}}>
                {selCat?.label} <span style={{fontSize:12,color:'var(--text-muted)',fontFamily:'Inter,sans-serif'}}>Q{qIdx+1}/{questions.length}</span>
              </div>
            </div>
            {/* Timer */}
            <div style={{...S.timerWrap, borderColor:danger?'rgba(239,68,68,0.5)':timerOn?`${A}55`:`${A}22`, animation:timerOn?(danger?'timerDanger 0.8s ease-in-out infinite':'timerPulse 2s ease-in-out infinite'):'none'}}>
              <svg style={S.timerSvg} viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke={`${A}10`} strokeWidth="2.5"/>
                <circle cx="24" cy="24" r="20" fill="none" stroke={danger?'#EF4444':A} strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={`${(timeLeft/TIMER)*circ} ${circ}`} strokeDashoffset={circ*0.25} transform="rotate(-90 24 24)"
                  style={{transition:'stroke-dasharray 1s linear'}}/>
              </svg>
              <div style={{...S.timerNum, color:danger?'#EF4444':A}}>{String(timeLeft).padStart(2,'0')}</div>
              <div style={S.timerSec}>SEC</div>
            </div>
          </div>

          {/* Team chip */}
          <div style={{display:'flex',justifyContent:'center'}}>
            <div style={{border:`1.5px solid ${curColor}45`,borderRadius:9999,padding:'9px 32px',fontFamily:"'Playfair Display',serif",fontSize:15,display:'flex',alignItems:'center',gap:10,background:'var(--bg-card)',backdropFilter:'blur(20px)'}}>
              {passPhase && <span style={{fontSize:10,letterSpacing:2,color:'#FFA500',fontFamily:'Inter,sans-serif',opacity:0.8}}>⚡ PASS →</span>}
              <span style={{color:curColor,fontWeight:700}}>{curName}</span>
              <span style={{color:'var(--text-muted)'}}>'s Turn</span>
            </div>
          </div>

          {/* Image card */}
          <div style={S.imgCard} className="glass-card">
            {loadErr ? (
              <div style={{textAlign:'center',padding:40,color:'var(--text-muted)',fontSize:14}}>{loadErr}</div>
            ) : !q ? (
              <div style={{textAlign:'center',padding:40,color:'var(--text-muted)',fontSize:14}}>Loading...</div>
            ) : (<>
              <div style={{fontSize:11,letterSpacing:3,color:`${A}88`,textTransform:'uppercase',fontFamily:'Inter,sans-serif'}}>{selCat?.kn} · Q{qIdx+1}</div>

              {/* Shadow image */}
              <div style={S.imgWrap}>
                <img
                  src={q.image}
                  alt={`Q${qIdx+1}`}
                  style={{
                    maxWidth:'100%', maxHeight:'100%', objectFit:'contain',
                    filter: revealed ? 'none' : 'brightness(0) contrast(1)',
                    transition:'filter 0.6s ease',
                    borderRadius:12,
                  }}
                  onError={e => {
                    const wrap = e.currentTarget.parentElement
                    if (wrap) {
                      wrap.innerHTML = '<div style="color:rgba(133,183,235,0.4);font-family:Inter,sans-serif;font-size:13px;text-align:center;padding:20px">Image not available</div>'
                    }
                  }}
                />
                {!revealed && (
                  <div style={{position:'absolute',bottom:12,right:12}}>
                    <button style={{...S.revealBtn, borderColor:`${A}55`, color:A}}
                      onClick={()=>{ setRevealed(true); setTimeLeft(TIMER); setTimerOn(true) }}>
                      Reveal Image
                    </button>
                  </div>
                )}
              </div>

              {/* FIX B4: Answer only shown when truly done (both judged), not on raw timeout */}
              {isDone && (
                <div style={{background:'rgba(34,197,94,0.07)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:12,padding:'12px 20px',textAlign:'center',fontSize:15,color:'var(--text-secondary)'}}>
                  Answer: <strong style={{color:'var(--accent-correct)',fontSize:18}}>{q.answer}</strong>
                </div>
              )}

              {/* Judge buttons — shown while not fully resolved */}
              {!isDone && revealed && (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{fontSize:13,color:'var(--text-muted)',fontFamily:'Inter,sans-serif',textAlign:'center'}}>
                    Was <strong style={{color:curColor}}>{curName}</strong>'s answer correct?
                  </div>
                  <div style={{display:'flex',gap:12}}>
                    <button style={S.btnC} onClick={()=>judge(true)}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.18)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.08)'}>
                      ✓ Correct {passPhase?'(+5)':'(+10)'}
                    </button>
                    <button style={S.btnW} onClick={()=>judge(false)}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.18)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'}>
                      ✕ Wrong
                    </button>
                  </div>
                </div>
              )}

              {/* Score badge */}
              {badge && (
                <div style={{alignSelf:'center',border:`1.5px solid ${badge.team===1?'rgba(255,215,0,0.5)':'rgba(255,165,0,0.5)'}`,borderRadius:9999,padding:'10px 28px',display:'flex',flexDirection:'column',alignItems:'center',background:badge.team===1?'rgba(255,215,0,0.1)':'rgba(255,165,0,0.1)',color:badge.team===1?'#FFD700':'#FFA500',animation:'scorePop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900}}>+{badge.pts}</span>
                  <span style={{fontSize:10,opacity:0.5}}>{badge.team===1?teams.team1:teams.team2}</span>
                </div>
              )}
            </>)}
          </div>

          {/* Next button */}
          {canNext && (
            <div style={{display:'flex',justifyContent:'center'}}>
              <button style={{...S.nextBtn, borderColor:`${A}45`, color:A}} onClick={handleNext}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=A; e.currentTarget.style.transform='translateY(-3px) scale(1.02)' }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=`${A}45`; e.currentTarget.style.transform='translateY(0) scale(1)' }}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700}}>{qIdx+1>=20?'Back to Categories':'Next Question →'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const S = {
  page:      { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px 40px', gap:20, position:'relative' },
  wrap:      { width:'100%', maxWidth:860, display:'flex', flexDirection:'column', gap:28 },
  catCard:   { borderRadius:16, padding:'22px 20px', border:'1px solid', display:'flex', flexDirection:'column', gap:4, textAlign:'left', transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', backdropFilter:'blur(16px)', cursor:'pointer' },
  backBtn:   { background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9999, padding:'10px 24px', color:'var(--text-muted)', fontSize:12, letterSpacing:1, cursor:'pointer', fontFamily:'Inter,sans-serif', alignSelf:'center' },
  backBtnSm: { background:'none', border:'none', color:`${A}55`, fontSize:12, letterSpacing:1, cursor:'pointer', fontFamily:'Inter,sans-serif', padding:0 },
  timerWrap: { position:'relative', width:76, height:76, borderRadius:'50%', border:'2px solid', background:'var(--bg-card)', backdropFilter:'blur(20px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', transition:'border-color 0.3s ease' },
  timerSvg:  { position:'absolute', inset:-3, width:'calc(100% + 6px)', height:'calc(100% + 6px)', pointerEvents:'none' },
  timerNum:  { fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, lineHeight:1, zIndex:1 },
  timerSec:  { fontSize:8, letterSpacing:2, color:'var(--text-muted)', fontFamily:'Inter,sans-serif', zIndex:1 },
  imgCard:   { width:'100%', padding:'24px 32px', display:'flex', flexDirection:'column', gap:16 },
  imgWrap:   { position:'relative', width:'100%', minHeight:320, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-glass)', borderRadius:16, overflow:'hidden' },
  revealBtn: { background:'rgba(0,0,0,0.6)', border:'1px solid', borderRadius:8, padding:'6px 14px', fontSize:11, fontWeight:600, cursor:'pointer', letterSpacing:1, backdropFilter:'blur(10px)' },
  btnC:      { flex:1, padding:'16px', borderRadius:14, cursor:'pointer', fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, border:'1.5px solid rgba(34,197,94,0.4)', background:'rgba(34,197,94,0.08)', color:'var(--accent-correct)', transition:'background 0.2s' },
  btnW:      { flex:1, padding:'16px', borderRadius:14, cursor:'pointer', fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, border:'1.5px solid rgba(239,68,68,0.4)', background:'rgba(239,68,68,0.08)', color:'var(--accent-wrong)', transition:'background 0.2s' },
  nextBtn:   { background:'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))', backdropFilter:'blur(20px)', border:'1.5px solid', borderRadius:16, padding:'16px 40px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer', transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)' },
}
