import { useState, useEffect, useRef, useCallback } from 'react'
import { useGame } from '../context/GameContext'
import ScoreBar from '../components/common/ScoreBar'
import SaveButton from '../components/common/SaveButton'
import SubRoundLandingPage from './SubRoundLandingPage'
import { api } from '../services/api'
import { sounds } from '../utils/sounds'

// 6 unique random 5-digit sequences (00-99) — pre-generated for consistency
const SEQUENCES = [
  [81, 14,  3, 94, 35],  // Team1 Q1
  [31, 28, 17, 47, 13],  // Team1 Q2
  [86, 94, 69, 11, 75],  // Team1 Q3
  [54,  4, 62, 38, 27],  // Team2 Q1
  [29, 64, 77,  8, 71],  // Team2 Q2
  [25, 91, 83, 56, 42],  // Team2 Q3
]

const EMOJI_CATS = [
  { id:'word',      label:'Padagalu',   sub:'Guess the Word',      kn:'ಪದಗಳು',    color:'#38BDF8', endpoint:'/round07/emoji/word',      type:'emoji' },
  { id:'actor',     label:'Nayakaru',   sub:'Guess the Actor',     kn:'ನಾಯಕರು',   color:'#60A5FA', endpoint:'/round07/emoji/actors',     type:'image' },
  { id:'game',      label:'Aathaalu',   sub:'Guess the Game',      kn:'ಆಟಗಳು',    color:'#34D399', endpoint:'/round07/emoji/game',       type:'emoji' },
  { id:'cricketer', label:'Cricketar',  sub:'Guess the Cricketer', kn:'ಕ್ರಿಕೆಟರ್',  color:'#A3E635', endpoint:'/round07/emoji/cricketer',  type:'image' },
  { id:'song',      label:'Haadu',      sub:'Guess the Song',      kn:'ಹಾಡು',     color:'#F472B6', endpoint:'/round07/emoji/songs',      type:'image' },
]

const SEQ_TIME  = 15  // show image for 15s
const ANS_TIME  = 30  // answer time 30s
const EMOJI_TIME = 30

export default function Round07PlayPage() {
  const { teams, addScore, tossWinner, setPhase, markRoundDone, markAnswered } = useGame()
  const [subRound, setSubRound] = useState('select')  // select | sequence | emoji | done
  const [subLanding, setSubLanding] = useState(null)   // null | 'sequence' | 'emoji'
  const [sequenceDone, setSequenceDone] = useState(false)
  const [emojiDone,    setEmojiDone]    = useState(false)

  const firstTeam  = tossWinner || 1
  const secondTeam = firstTeam === 1 ? 2 : 1

  const handleSequenceDone = () => {
    setSequenceDone(true)
    setSubRound('select')   // return to sub-round select so Emoji can be played next
  }

  const handleEmojiDone = () => {
    setEmojiDone(true)
    setSubRound('select')
  }

  // Mark round done once both sub-rounds complete
  const bothDone = sequenceDone && emojiDone

  if (subLanding === 'sequence') {
    return (
      <SubRoundLandingPage
        accent="#38BDF8"
        tag="ROUND 07 · SUB-ROUND 1"
        title="Krama Smarana"
        titleKn="ಕ್ರಮ ಸ್ಮರಣ"
        sub="Sequence Memory"
        tagline="A sequence flashes for 15 seconds. It vanishes. Can you repeat it perfectly?"
        icon="🧠"
        backLabel="← Sub-Rounds"
        onBack={() => setSubLanding(null)}
        onContinue={() => { setSubLanding(null); setSubRound('sequence') }}
      />
    )
  }

  if (subLanding === 'emoji') {
    return (
      <SubRoundLandingPage
        accent="#F472B6"
        tag="ROUND 07 · SUB-ROUND 2"
        title="Moji Mania"
        titleKn="ಮೋಜಿ ಮ್ಯಾನಿಯಾ"
        sub="Emoji Decoding"
        tagline="Words, actors, games, cricketers and songs — all hidden behind emoji. Decode them all."
        icon="🎭"
        backLabel="← Sub-Rounds"
        onBack={() => setSubLanding(null)}
        onContinue={() => { setSubLanding(null); setSubRound('emoji') }}
      />
    )
  }

  if (subRound === 'select') return (
    <>
      <ScoreBar />
      <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',padding:'72px 24px 48px',position:'relative'}}>
        {['tl','tr','bl','br'].map(p=><div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:'#38BDF8'}}/>)}

        <div style={{width:'100%',maxWidth:820,display:'flex',flexDirection:'column',gap:32}} className="fade-in">

          {/* Header */}
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
            <button style={{alignSelf:'flex-start',background:'none',border:'none',color:'rgba(56,189,248,0.4)',fontSize:12,letterSpacing:1,cursor:'pointer',fontFamily:'Inter,sans-serif',padding:0}}
              onClick={()=>setPhase('roundSelect')}>← All Rounds</button>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:4,color:'rgba(56,189,248,0.5)',fontFamily:'Inter,sans-serif'}}>ROUND 07 · DECODE ZONE</div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,color:'#38BDF8',textAlign:'center'}}>Choose Sub-Round</h1>
            <div style={{width:80,height:1,background:'linear-gradient(90deg,transparent,#38BDF8,transparent)',margin:'4px 0 8px'}}/>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.35)',fontFamily:'Inter,sans-serif',textAlign:'center'}}>
              Two different challenges · Memory & Emoji decoding
            </p>
          </div>

          {/* Sub-round cards — 2 wide, rich info */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>

            {/* Krama Smarana */}
            <button
              style={{
                position:'relative',overflow:'hidden',
                borderRadius:22,padding:'32px 28px',
                border:`1px solid ${sequenceDone?'rgba(34,197,94,0.4)':'rgba(56,189,248,0.25)'}`,
                background:sequenceDone
                  ? 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.03))'
                  : 'linear-gradient(135deg,rgba(56,189,248,0.08),rgba(255,255,255,0.02))',
                display:'flex',flexDirection:'column',gap:12,textAlign:'left',
                cursor:'pointer',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
                transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',outline:'none',
              }}
              onClick={()=>{ if(!sequenceDone) setSubLanding('sequence') }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=sequenceDone?'rgba(34,197,94,0.6)':'#38BDF8';e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.boxShadow=`0 20px 48px ${sequenceDone?'rgba(34,197,94,0.12)':'rgba(56,189,248,0.15)'}`}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=sequenceDone?'rgba(34,197,94,0.4)':'rgba(56,189,248,0.25)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
              {sequenceDone&&<div style={{position:'absolute',top:14,right:14,width:24,height:24,borderRadius:'50%',background:'#22C55E',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff',fontWeight:700,animation:'checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>✓</div>}
              <div style={{fontSize:36}}>🧠</div>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:sequenceDone?'#22C55E':'#38BDF8',marginBottom:4}}>Krama Smarana</div>
                <div style={{fontSize:12,color:sequenceDone?'rgba(34,197,94,0.6)':'rgba(56,189,248,0.6)',letterSpacing:2,fontFamily:'Inter,sans-serif'}}>ಕ್ರಮ ಸ್ಮರಣ · Sequence Memory</div>
              </div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',lineHeight:1.7,fontFamily:'Inter,sans-serif'}}>
                {sequenceDone
                  ? 'Sub-round completed ✓'
                  : '3 questions per team · A number sequence is shown for 15 seconds · Then hidden · Repeat it verbally in 30 seconds'}
              </div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <span style={{fontSize:11,color:'#22C55E',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:9999,padding:'3px 10px',fontFamily:'Inter'}}>+10 correct</span>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:9999,padding:'3px 10px',fontFamily:'Inter'}}>No pass</span>
                <span style={{fontSize:11,color:'rgba(56,189,248,0.6)',background:'rgba(56,189,248,0.06)',border:'1px solid rgba(56,189,248,0.12)',borderRadius:9999,padding:'3px 10px',fontFamily:'Inter'}}>6 total Q</span>
              </div>
              <div style={{position:'absolute',bottom:0,left:16,right:16,height:2,borderRadius:1,background:`linear-gradient(90deg,transparent,${sequenceDone?'rgba(34,197,94,0.4)':'rgba(56,189,248,0.3)'},transparent)`}}/>
            </button>

            {/* Moji Mania */}
            <button
              style={{
                position:'relative',overflow:'hidden',
                borderRadius:22,padding:'32px 28px',
                border:`1px solid ${emojiDone?'rgba(34,197,94,0.4)':'rgba(56,189,248,0.25)'}`,
                background:emojiDone
                  ? 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.03))'
                  : 'linear-gradient(135deg,rgba(56,189,248,0.08),rgba(255,255,255,0.02))',
                display:'flex',flexDirection:'column',gap:12,textAlign:'left',
                cursor:'pointer',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
                transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',outline:'none',
              }}
              onClick={()=>{ if(!emojiDone) setSubLanding('emoji') }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=emojiDone?'rgba(34,197,94,0.6)':'#38BDF8';e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.boxShadow=`0 20px 48px ${emojiDone?'rgba(34,197,94,0.12)':'rgba(56,189,248,0.15)'}`}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=emojiDone?'rgba(34,197,94,0.4)':'rgba(56,189,248,0.25)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
              {emojiDone&&<div style={{position:'absolute',top:14,right:14,width:24,height:24,borderRadius:'50%',background:'#22C55E',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff',fontWeight:700,animation:'checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>✓</div>}
              <div style={{fontSize:36}}>🎭</div>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:emojiDone?'#22C55E':'#38BDF8',marginBottom:4}}>Moji Mania</div>
                <div style={{fontSize:12,color:emojiDone?'rgba(34,197,94,0.6)':'rgba(56,189,248,0.6)',letterSpacing:2,fontFamily:'Inter,sans-serif'}}>ಮೋಜಿ ಮ್ಯಾನಿಯಾ · Emoji Word</div>
              </div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',lineHeight:1.7,fontFamily:'Inter,sans-serif'}}>
                {emojiDone
                  ? 'Sub-round completed ✓'
                  : '5 categories · 10 questions each · Decode emoji combinations to guess words, actors, games, cricketers and songs'}
              </div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <span style={{fontSize:11,color:'#22C55E',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:9999,padding:'3px 10px',fontFamily:'Inter'}}>+10 correct</span>
                <span style={{fontSize:11,color:'#5DCAA5',background:'rgba(93,202,165,0.08)',border:'1px solid rgba(93,202,165,0.2)',borderRadius:9999,padding:'3px 10px',fontFamily:'Inter'}}>+5 pass</span>
                <span style={{fontSize:11,color:'rgba(56,189,248,0.6)',background:'rgba(56,189,248,0.06)',border:'1px solid rgba(56,189,248,0.12)',borderRadius:9999,padding:'3px 10px',fontFamily:'Inter'}}>50 total Q</span>
              </div>
              <div style={{position:'absolute',bottom:0,left:16,right:16,height:2,borderRadius:1,background:`linear-gradient(90deg,transparent,${emojiDone?'rgba(34,197,94,0.4)':'rgba(56,189,248,0.3)'},transparent)`}}/>
            </button>
          </div>

          {/* Complete / Back */}
          <div style={{display:'flex',justifyContent:'center'}}>
            <SaveButton />
          </div>

          {bothDone ? (
            <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:14}} className="fade-in">
              <div style={{fontSize:13,color:'rgba(34,197,94,0.7)',fontFamily:'Inter,sans-serif',letterSpacing:1}}>🎉 Both sub-rounds complete!</div>
              <button className="btn-gold" style={{borderColor:'rgba(56,189,248,0.5)',color:'#38BDF8',fontSize:14,padding:'16px 52px',letterSpacing:3}}
                onClick={()=>{ markRoundDone(7); setSubRound('done') }}>
                ✓ Round 07 Complete →
              </button>
              <SaveButton />
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
              {(sequenceDone||emojiDone)&&<SaveButton />}
              <button style={{background:'none',border:'1px solid rgba(255,255,255,0.08)',borderRadius:9999,padding:'10px 24px',color:'rgba(255,255,255,0.3)',fontSize:12,letterSpacing:1,cursor:'pointer',fontFamily:'Inter,sans-serif'}}
                onClick={()=>setPhase('roundSelect')}>← Back to Rounds</button>
            </div>
          )}
        </div>
      </div>
    </>
  )


  if (subRound === 'sequence') return (
    <SequenceRound teams={teams} addScore={addScore} firstTeam={firstTeam} secondTeam={secondTeam} onDone={handleSequenceDone} onBack={()=>setSubRound('select')} markAnswered={markAnswered}/>
  )

  if (subRound === 'emoji') return (
    <EmojiRound teams={teams} addScore={addScore} tossWinner={tossWinner} onDone={handleEmojiDone} onBack={()=>setSubRound('select')} markAnswered={markAnswered}/>
  )

  // Done
  return (
    <>
      <ScoreBar />
      <div style={S.page}>
        <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:20}} className="fade-in">
          <div style={{fontSize:52}}>🎯</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,letterSpacing:4,color:'rgba(56,189,248,0.6)'}}>ROUND 07 COMPLETE</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:40,fontWeight:900,color:'#38BDF8'}}>Decode Zone</div>
          <button className="btn-gold" style={{marginTop:20,borderColor:'rgba(56,189,248,0.5)',color:'#38BDF8'}}
            onClick={()=>setPhase('roundSelect')}>Back to Rounds →</button>
        </div>
      </div>
    </>
  )
}

function SequenceRound({ teams, addScore, firstTeam, secondTeam, onDone, onBack, markAnswered }) {
  // onBack prop used by ← Sub-rounds button
  const TOTAL_PER_TEAM = 3
  const [team, setTeam]           = useState(firstTeam)
  const [qIdx, setQIdx]           = useState(0)
  const [seqPhase, setSeqPhase]   = useState('show')   // show | answer | result
  const [timeLeft, setTimeLeft]   = useState(SEQ_TIME)
  const [timerOn, setTimerOn]     = useState(true)
  const [correct, setCorrect]     = useState(null)
  const [badge, setBadge]         = useState(null)
  const [team1Done, setTeam1Done] = useState(false)
  const timerRef = useRef(null)

  const teamName  = team===1?teams.team1:teams.team2
  const teamColor = team===1?'#FFD700':'#FFA500'
  const otherTeam = team===1?secondTeam:firstTeam

  const stopTimer = useCallback(() => { setTimerOn(false); clearInterval(timerRef.current) }, [])

  useEffect(()=>{
    if(!timerOn)return
    timerRef.current=setInterval(()=>setTimeLeft(t=>{
      if(t<=1){stopTimer();setSeqPhase(p=>p==='show'?'answer':'result');sounds.timerEnd();return 0}
      if(t<=6) sounds.tick()
      return t-1
    }),1000)
    return ()=>clearInterval(timerRef.current)
  },[timerOn, stopTimer])

  const startAnswer=()=>{stopTimer();setSeqPhase('answer');setTimeLeft(ANS_TIME);setTimerOn(true)}
  const judgeCorrect=()=>{
    stopTimer(); setCorrect(true)
    addScore(team,10); setBadge({pts:10,color:teamColor})
    if(markAnswered) markAnswered(`r07_seq_team${team}`, qIdx)
    sounds.correct()
    setSeqPhase('result')
  }
  const judgeWrong=()=>{ stopTimer(); setCorrect(false); sounds.wrong(); setSeqPhase('result') }

  const handleNext=()=>{
    setBadge(null); setCorrect(null)
    if(qIdx+1>=TOTAL_PER_TEAM){
      if(!team1Done){
        setTeam1Done(true); setTeam(otherTeam); setQIdx(0); setSeqPhase('show'); setTimeLeft(SEQ_TIME); setTimerOn(true)
      } else { onDone() }
    } else {
      setQIdx(i=>i+1); setSeqPhase('show'); setTimeLeft(SEQ_TIME); setTimerOn(true)
    }
  }

  const danger = timeLeft<=5
  const circ   = 2*Math.PI*20
  const maxTime = seqPhase==='show'?SEQ_TIME:ANS_TIME

  return(
    <>
      <ScoreBar/>
      <div style={S.page}>
        {['tl','tr','bl','br'].map(p=><div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:'#38BDF8'}}/>)}
        <div style={{width:'100%',maxWidth:700,display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div>
                <button style={{background:'none',border:'none',color:'rgba(56,189,248,0.35)',fontSize:11,letterSpacing:1,cursor:'pointer',fontFamily:'Inter,sans-serif',padding:0,marginBottom:4}}
                  onClick={()=>{stopTimer();onBack()}}>← Sub-rounds</button>
                <div style={{fontSize:11,letterSpacing:3,color:'rgba(56,189,248,0.5)',fontFamily:'Inter,sans-serif'}}>KRAMA SMARANA · SEQUENCE MEMORY</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:teamColor,marginTop:4}}>
                  {teamName} · Q{qIdx+1}/{TOTAL_PER_TEAM}
                </div>
              </div>
            </div>
            {/* Timer */}
            <div style={{...S.timerWrap,borderColor:danger?'rgba(239,68,68,0.5)':'rgba(56,189,248,0.4)'}}>
              <svg style={S.timerSvg} viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(56,189,248,0.07)" strokeWidth="2.5"/>
                <circle cx="24" cy="24" r="20" fill="none" stroke={danger?'#EF4444':'#38BDF8'} strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={`${(timeLeft/maxTime)*circ} ${circ}`} strokeDashoffset={circ*0.25} transform="rotate(-90 24 24)"
                  style={{transition:'stroke-dasharray 1s linear'}}/>
              </svg>
              <div style={{...S.timerNum,color:danger?'#EF4444':'#38BDF8'}}>{String(timeLeft).padStart(2,'0')}</div>
              <div style={S.timerSec}>{seqPhase==='show'?'SHOW':'ANS'}</div>
            </div>
          </div>

          <div style={S.seqCard} className="glass-card">
            {seqPhase==='show'&&(
              <>
                <div style={{fontSize:12,letterSpacing:3,color:'rgba(56,189,248,0.5)',fontFamily:'Inter,sans-serif',textAlign:'center'}}>MEMORISE THIS SEQUENCE</div>
                <div style={{background:'rgba(56,189,248,0.06)',border:'1.5px solid rgba(56,189,248,0.25)',borderRadius:16,padding:'32px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:20}}>
                  <div style={{fontSize:11,letterSpacing:3,color:'rgba(56,189,248,0.5)',fontFamily:'Inter,sans-serif'}}>5-NUMBER SEQUENCE · Q{qIdx+1}</div>
                  <div style={{display:'flex',gap:14}}>
                    {SEQUENCES[team===firstTeam?qIdx:qIdx+3].map((num,ni)=>(
                      <div key={ni} style={{width:64,height:64,borderRadius:14,background:'rgba(56,189,248,0.12)',border:'2px solid rgba(56,189,248,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:'#38BDF8',boxShadow:'0 0 18px rgba(56,189,248,0.15)'}}>
                        {String(num).padStart(2,'0')}
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:12,color:'rgba(56,189,248,0.4)',fontFamily:'Inter,sans-serif'}}>Memorise all 5 numbers · 15 seconds</div>
                </div>
                <button style={{...S.nextBtn,borderColor:'rgba(56,189,248,0.45)',color:'#38BDF8',marginTop:4}} onClick={startAnswer}>
                  I've seen it — Start Answer Timer
                </button>
              </>
            )}

            {seqPhase==='answer'&&(
              <>
                <div style={{fontSize:12,letterSpacing:3,color:'rgba(56,189,248,0.5)',fontFamily:'Inter,sans-serif',textAlign:'center'}}>REPEAT THE SEQUENCE VERBALLY</div>
                <div style={{background:'rgba(56,189,248,0.04)',border:'1px solid rgba(56,189,248,0.15)',borderRadius:12,padding:'20px',textAlign:'center'}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:'rgba(56,189,248,0.6)',marginBottom:12}}>Sequence was:</div>
                  <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                    {SEQUENCES[team===firstTeam?qIdx:qIdx+3].map((num,ni)=>(
                      <div key={ni} style={{width:52,height:52,borderRadius:10,background:'rgba(56,189,248,0.08)',border:'1.5px solid rgba(56,189,248,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:'rgba(56,189,248,0.7)'}}>
                        {String(num).padStart(2,'0')}
                      </div>
                    ))}
                  </div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:'rgba(255,255,255,0.3)',marginTop:12}}>{teamName} is answering…</div>
                </div>
                <div style={{display:'flex',gap:12}}>
                  <button style={S.btnC} onClick={judgeCorrect} onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.08)'}>✓ Correct (+10)</button>
                  <button style={S.btnW} onClick={judgeWrong} onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'}>✕ Wrong (0)</button>
                </div>
              </>
            )}

            {seqPhase==='result'&&(
              <>
                <div style={{textAlign:'center',padding:'20px 0'}}>
                  {correct
                    ? <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'#22C55E'}}>✓ Correct! +10 points</div>
                    : <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'#EF4444'}}>✕ Wrong — 0 points</div>
                  }
                </div>
                {badge&&<div style={{alignSelf:'center',border:`1.5px solid ${badge.color}55`,borderRadius:9999,padding:'10px 28px',background:`${badge.color}12`,color:badge.color,animation:'scorePop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900}}>+{badge.pts}</span>
                </div>}
                <button style={{...S.nextBtn,borderColor:'rgba(56,189,248,0.45)',color:'#38BDF8'}} onClick={handleNext}>
                  {qIdx+1>=TOTAL_PER_TEAM&&team1Done ? 'Finish Sequence Round' : qIdx+1>=TOTAL_PER_TEAM ? `${teams[`team${team===1?2:1}`]}'s Turn →` : 'Next Question →'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function EmojiRound({ teams, addScore, tossWinner, onDone, onBack, markAnswered }) {
  const [selCat, setSelCat]               = useState(null)
  const [completedCats, setCompletedCats] = useState(new Set())
  const [questions, setQuestions]         = useState([])
  const [qIdx, setQIdx]                   = useState(0)
  const [playPhase, setPlayPhase]         = useState('catSelect')
  const [emojiCatLanding, setEmojiCatLanding] = useState(false)
  const [passPhase, setPassPhase]         = useState(false)
  const [t1Result, setT1Result]           = useState(null)
  const [t2Result, setT2Result]           = useState(null)
  const [badge, setBadge]                 = useState(null)
  const [timeLeft, setTimeLeft]           = useState(EMOJI_TIME)
  const [timerOn, setTimerOn]             = useState(false)
  const [revealed, setRevealed]           = useState(false)
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const timerRef = useRef(null)

  // Load questions when category selected
  useEffect(() => {
    if (!selCat?.endpoint) return
    api.getR07Questions(selCat.endpoint)
      .then(d => setQuestions(d.questions || []))
      .catch(() => setQuestions([]))
  }, [selCat])

  const firstTeam  = tossWinner || 1
  const otherTeam  = firstTeam === 1 ? 2 : 1
  const teamForQ   = (qi) => qi%2===0 ? firstTeam : otherTeam
  const activeTeam = passPhase ? (teamForQ(qIdx)===1?2:1) : teamForQ(qIdx)
  const activeName = activeTeam===1?teams.team1:teams.team2
  const activeColor= activeTeam===1?'#FFD700':'#FFA500'

  const stopTimer = useCallback(() => { setTimerOn(false); clearInterval(timerRef.current) }, [])
  useEffect(()=>{
    if(!timerOn)return
    timerRef.current=setInterval(()=>setTimeLeft(t=>{
      if(t<=1){stopTimer();sounds.timerEnd();return 0}
      if(t<=10) sounds.tick()
      return t-1
    }),1000)
    return ()=>clearInterval(timerRef.current)
  },[timerOn, stopTimer])

  // Reset per question
  useEffect(()=>{
    if(playPhase!=='play')return
    setPassPhase(false);setT1Result(null);setT2Result(null);setTimeLeft(EMOJI_TIME);setBadge(null);setRevealed(false);setAnswerRevealed(false)
    // For emoji type, timer starts immediately. For image type, wait for reveal.
    if(selCat?.type==='emoji') setTimerOn(true)
    else setTimerOn(false)
  },[qIdx,selCat])

  // Auto-pass when timer hits 0
  useEffect(()=>{
    if(timeLeft!==0)return
    if(t1Result!==null||t2Result!==null)return
    if(!passPhase){
      setT1Result('wrong')
      setPassPhase(true)
      setTimeLeft(EMOJI_TIME)
      setTimerOn(true)
    } else {
      setT2Result('wrong')
    }
  },[timeLeft])

  const handleReveal = () => {
    setRevealed(true)
    setTimeLeft(EMOJI_TIME)
    setTimerOn(true)
  }

  const judge=(correct)=>{
    stopTimer()
    if(!passPhase){
      setT1Result(correct?'correct':'wrong')
      if(correct){addScore(teamForQ(qIdx),10);setBadge({pts:10,color:activeColor,team:activeTeam});sounds.correct();if(markAnswered&&selCat)markAnswered(`r07_emoji_${selCat.id}`,qIdx)}
      else { setPassPhase(true); sounds.pass() }
    } else {
      setT2Result(correct?'correct':'wrong')
      if(correct){const pt=teamForQ(qIdx)===1?2:1;addScore(pt,5);setBadge({pts:5,color:pt===1?'#FFD700':'#FFA500',team:pt});sounds.correct()}
      else sounds.wrong()
    }
  }

  const isDone   = t1Result==='correct'||t2Result==='correct'||(t1Result==='wrong'&&t2Result==='wrong')||(timeLeft===0&&t2Result==='wrong')
  const TOTAL_Q  = 10
  const danger   = timeLeft<=10
  const circ     = 2*Math.PI*20

  const handleNext=()=>{
    setBadge(null)
    if(questions.length>0 && qIdx+1>=questions.length){setCompletedCats(prev=>new Set([...prev,selCat.id]));setPlayPhase('catSelect')}
    else setQIdx(i=>i+1)
  }

  const EMOJI_TAGLINES = {
    word:      'Emoji clues spell out a hidden word. Decode the symbols.',
    actor:     'A Kannada screen legend lurks in the image. Name them.',
    game:      'Sports and games encoded in emoji. What game is it?',
    cricketer: 'A cricket hero is hidden in the image. Can you name them?',
    song:      'A famous song is encoded in visuals. What is it?',
  }
  const EMOJI_ICONS = { word:'💬', actor:'🎬', game:'🎮', cricketer:'🏏', song:'🎵' }

  if (emojiCatLanding && selCat) {
    return (
      <SubRoundLandingPage
        accent={selCat.color}
        tag={`ROUND 07 · MOJI MANIA · ${selCat.sub.toUpperCase()}`}
        title={selCat.label}
        titleKn={selCat.kn}
        sub={selCat.sub}
        tagline={EMOJI_TAGLINES[selCat.id] || '10 questions · emoji decoding'}
        icon={EMOJI_ICONS[selCat.id] || '🎭'}
        backLabel="← Emoji Categories"
        onBack={() => { setEmojiCatLanding(false); setSelCat(null) }}
        onContinue={() => { setEmojiCatLanding(false); setQIdx(0); setPlayPhase('play') }}
      />
    )
  }

  if(playPhase==='catSelect') return(
    <div style={S.page}>
      <div style={{position:'absolute',top:80,left:24}}>
        <button style={S.backBtnSm} onClick={onBack}>← Sub-rounds</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:24,width:'100%',maxWidth:860}} className="fade-in">
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:5,color:'rgba(56,189,248,0.6)',fontFamily:'Inter,sans-serif',marginBottom:10}}>MOJI MANIA · EMOJI WORD</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,color:'#38BDF8'}}>Select Emoji Category</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,width:'100%'}}>
          {EMOJI_CATS.map(cat=>{
            const done=completedCats.has(cat.id)
            return(
              <button key={cat.id}
                style={{...S.catCard,borderColor:done?'rgba(34,197,94,0.4)':`${cat.color}25`,background:done?'rgba(34,197,94,0.05)':'rgba(255,255,255,0.03)',cursor:done?'default':'pointer',opacity:done?0.7:1}}
                onClick={()=>{if(done)return;setSelCat(cat);setEmojiCatLanding(true)}}
                onMouseEnter={e=>{if(!done){e.currentTarget.style.borderColor=cat.color;e.currentTarget.style.transform='translateY(-3px)'}}}
                onMouseLeave={e=>{if(!done){e.currentTarget.style.borderColor=`${cat.color}25`;e.currentTarget.style.transform='translateY(0)'}}}>
                <div style={{fontSize:10,color:done?'#22C55E':cat.color,fontWeight:700,letterSpacing:1,fontFamily:'Inter,sans-serif',marginBottom:2}}>{cat.kn}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:done?'rgba(34,197,94,0.7)':'#F0F0F0'}}>{cat.label}</div>
                <div style={{fontSize:10,color:done?'rgba(34,197,94,0.5)':`${cat.color}66`,marginTop:2}}>{done?'Done ✓':cat.sub}</div>
              </button>
            )
          })}
        </div>
        {completedCats.size>=EMOJI_CATS.length&&<button className="btn-gold" style={{borderColor:'rgba(56,189,248,0.5)',color:'#38BDF8'}} onClick={onDone}>Finish Emoji Round →</button>}
      </div>
    </div>
  )

  return(
    <div style={{...S.page,justifyContent:'flex-start',paddingTop:80}}>
      <div style={{width:'100%',maxWidth:700,display:'flex',flexDirection:'column',gap:18}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <button style={S.backBtnSm} onClick={()=>{stopTimer();setPlayPhase('catSelect')}}>← Categories</button>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:'#38BDF8',marginTop:4}}>
              {selCat?.label} <span style={{fontSize:12,color:'rgba(255,255,255,0.25)',fontFamily:'Inter,sans-serif'}}>Q{qIdx+1}/{TOTAL_Q}</span>
            </div>
          </div>
          <div style={{...S.timerWrap,borderColor:danger?'rgba(239,68,68,0.5)':timerOn?'rgba(56,189,248,0.4)':'rgba(56,189,248,0.15)'}}>
            <svg style={S.timerSvg} viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(56,189,248,0.07)" strokeWidth="2.5"/>
              <circle cx="24" cy="24" r="20" fill="none" stroke={danger?'#EF4444':'#38BDF8'} strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={`${(timeLeft/EMOJI_TIME)*circ} ${circ}`} strokeDashoffset={circ*0.25} transform="rotate(-90 24 24)"
                style={{transition:'stroke-dasharray 1s linear'}}/>
            </svg>
            <div style={{...S.timerNum,color:danger?'#EF4444':'#38BDF8'}}>{String(timeLeft).padStart(2,'0')}</div>
            <div style={S.timerSec}>{timerOn?'SEC':'WAIT'}</div>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'center'}}>
          <div style={{border:`1.5px solid ${activeColor}45`,borderRadius:9999,padding:'9px 32px',fontFamily:"'Playfair Display',serif",fontSize:15,display:'flex',alignItems:'center',gap:10,background:'rgba(14,14,26,0.8)',backdropFilter:'blur(20px)'}}>
            {passPhase&&<span style={{fontSize:10,letterSpacing:2,color:'#FFA500',fontFamily:'Inter,sans-serif'}}>⚡ PASS →</span>}
            <span style={{color:activeColor,fontWeight:700}}>{activeName}</span>
            <span style={{color:'rgba(255,255,255,0.3)'}}>'s Turn</span>
          </div>
        </div>
        <div style={S.seqCard} className="glass-card">
          {/* Question content */}
          {(() => {
            const q = questions[qIdx]
            if (!q) return <div style={{textAlign:'center',padding:40,color:'rgba(255,255,255,0.2)'}}>Loading...</div>
            if (selCat?.type === 'emoji') return (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:64,letterSpacing:8,marginBottom:16}}>{q.emoji}</div>
                <div style={{fontSize:12,color:'rgba(56,189,248,0.5)',letterSpacing:2,fontFamily:'Inter,sans-serif'}}>Guess the {selCat.sub.replace('Guess the ','')}</div>
              </div>
            )
            if (selCat?.type === 'image') return (
              <div style={{position:'relative',width:'100%',minHeight:260,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(56,189,248,0.03)',borderRadius:14,overflow:'hidden'}}>
                <img src={q.image} alt={`Q${qIdx+1}`}
                  style={{maxWidth:'100%',maxHeight:260,objectFit:'contain',borderRadius:10,
                    filter: revealed ? 'none' : 'brightness(0) contrast(1)',
                    transition:'filter 0.7s ease'}}
                  onError={e=>{e.currentTarget.parentElement.innerHTML='<div style="color:rgba(255,255,255,0.2);font-size:13px">Image not found</div>'}}/>
                {!revealed && (
                  <div style={{position:'absolute',bottom:12,right:12}}>
                    <button style={{background:'rgba(0,0,0,0.6)',border:'1px solid rgba(56,189,248,0.5)',borderRadius:8,padding:'6px 14px',fontSize:11,fontWeight:600,cursor:'pointer',letterSpacing:1,backdropFilter:'blur(10px)',color:'#38BDF8'}}
                      onClick={handleReveal}>
                      Reveal Image →
                    </button>
                  </div>
                )}
              </div>
            )
            return null
          })()}
          {/* Show judge buttons only when timer is running (after reveal for images) */}
          {(selCat?.type==='emoji' || revealed) && !isDone&&(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.35)',fontFamily:'Inter,sans-serif',textAlign:'center'}}>Was <strong style={{color:activeColor}}>{activeName}</strong>'s answer correct?</div>
              <div style={{display:'flex',gap:12}}>
                <button style={S.btnC} onClick={()=>judge(true)} onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.08)'}>✓ Correct (+{passPhase?5:10})</button>
                <button style={S.btnW} onClick={()=>judge(false)} onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'}>✕ Wrong</button>
              </div>
            </div>
          )}
          {badge&&<div style={{alignSelf:'center',border:`1.5px solid ${badge.color}55`,borderRadius:9999,padding:'10px 28px',background:`${badge.color}12`,color:badge.color,animation:'scorePop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900}}>+{badge.pts}</span>
          </div>}
          {/* Show Answer button when both teams wrong */}
          {isDone && !answerRevealed && !(t1Result==='correct'||t2Result==='correct') && (
            <button style={{...S.nextBtn,borderColor:'rgba(93,202,165,0.5)',color:'#5DCAA5'}} onClick={()=>setAnswerRevealed(true)}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,letterSpacing:1}}>Show Answer</span>
              <span style={{fontSize:10,letterSpacing:1,color:'rgba(93,202,165,0.5)'}}>Reveal correct answer</span>
            </button>
          )}
          {/* Answer reveal box — auto-shows on correct, manual on wrong */}
          {(answerRevealed || t1Result==='correct' || t2Result==='correct') && questions[qIdx] && (
            <div style={{background:'rgba(34,197,94,0.07)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:14,padding:'16px 24px',textAlign:'center',animation:'scorePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>
              <div style={{fontSize:11,letterSpacing:3,color:'rgba(34,197,94,0.5)',fontFamily:'Inter,sans-serif',marginBottom:6}}>CORRECT ANSWER</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:'#22C55E'}}>{questions[qIdx].answer}</div>
            </div>
          )}
          {isDone&&<button style={{...S.nextBtn,borderColor:'rgba(56,189,248,0.45)',color:'#38BDF8'}} onClick={handleNext}>
            {questions.length>0 && qIdx+1>=questions.length?'Back to Emoji Categories':'Next →'}
          </button>}
        </div>
      </div>
    </div>
  )
}

const S = {
  page:        { minHeight:'100vh',background:'var(--bg-primary)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 24px 40px',gap:20,position:'relative' },
  subRoundCard:{ borderRadius:18,padding:'24px 28px',border:'1px solid',display:'flex',flexDirection:'column',gap:4,textAlign:'left',transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',backdropFilter:'blur(16px)',cursor:'pointer',background:'rgba(255,255,255,0.03)' },
  catCard:     { borderRadius:14,padding:'18px 16px',border:'1px solid',display:'flex',flexDirection:'column',gap:4,textAlign:'left',transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',backdropFilter:'blur(14px)' },
  seqCard:     { width:'100%',padding:'28px 32px',display:'flex',flexDirection:'column',gap:16 },
  backBtn:     { background:'none',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9999,padding:'10px 24px',color:'rgba(255,255,255,0.35)',fontSize:12,letterSpacing:1,cursor:'pointer',fontFamily:'Inter,sans-serif' },
  backBtnSm:   { background:'none',border:'none',color:'rgba(56,189,248,0.3)',fontSize:12,letterSpacing:1,cursor:'pointer',fontFamily:'Inter,sans-serif',padding:0 },
  timerWrap:   { position:'relative',width:72,height:72,borderRadius:'50%',border:'2px solid',background:'rgba(18,18,34,0.7)',backdropFilter:'blur(20px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',transition:'border-color 0.3s ease' },
  timerSvg:    { position:'absolute',inset:-3,width:'calc(100% + 6px)',height:'calc(100% + 6px)',pointerEvents:'none' },
  timerNum:    { fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,lineHeight:1,zIndex:1 },
  timerSec:    { fontSize:7,letterSpacing:2,color:'rgba(255,255,255,0.3)',fontFamily:'Inter,sans-serif',zIndex:1 },
  btnC:{ flex:1,padding:'15px',borderRadius:14,cursor:'pointer',fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,border:'1.5px solid rgba(34,197,94,0.4)',background:'rgba(34,197,94,0.08)',color:'#22C55E',transition:'background 0.2s' },
  btnW:{ flex:1,padding:'15px',borderRadius:14,cursor:'pointer',fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,border:'1.5px solid rgba(239,68,68,0.4)',background:'rgba(239,68,68,0.08)',color:'#EF4444',transition:'background 0.2s' },
  nextBtn:{ background:'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))',backdropFilter:'blur(20px)',border:'1.5px solid',borderRadius:16,padding:'15px 36px',display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)' },
}
