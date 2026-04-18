import { useGame } from '../context/GameContext'
import ScoreBar from '../components/common/ScoreBar'

const RULES = [
  { icon:'◈', label:'10 Categories, 30 Questions Each', detail:'Choose from 10 unique battlegrounds. Each holds 30 questions. Pick your category wisely.' },
  { icon:'◉', label:'Reveal Options to Start the Clock', detail:'The question appears first — no clock yet. Once you reveal the options, the 30‑second timer begins.' },
  { icon:'◆', label:'Answer Before Options — Big Reward', detail:'If a team calls the answer before options appear, a correct response earns a powerful +20 points.' },
  { icon:'◇', label:'Answer After Options', detail:'Correct answer once options are shown earns a confident +10 points. Think fast, think right.' },
  { icon:'▷', label:'Pass to the Opposing Team', detail:'Answer wrong and the question passes to the rivals — they get one clean attempt worth +5 if they nail it.' },
  { icon:'✕', label:'Wrong Without Options — Penalty', detail:'Guessing blind and getting it wrong costs −10 points. Confidence has its price.' },
]

const SCORING = [
  { label:'Without Options', points:'+20', color:'#FFD700' },
  { label:'With Options',    points:'+10', color:'#FFA500' },
  { label:'Pass Correct',   points:'+5',  color:'#5DCAA5' },
  { label:'Wrong (no opt)', points:'−10', color:'#EF4444' },
]

export default function Round01RulesPage() {
  const { teams, tossWinner, setPhase } = useGame()
  const starterName = tossWinner === 1 ? teams.team1 : teams.team2

  return (
    <>
      <ScoreBar />
      <div style={S.page}>
        {['tl','tr','bl','br'].map(p => <div key={p} className={`corner-bracket corner-bracket--${p}`} />)}

        <div style={S.wrap} className="fade-in">
          <div style={S.header}>
            <div style={S.badge}>ROUND 01</div>
            <h1 style={S.roundName}>Category Clash</h1>
            <div className="gold-line" style={{ margin:'14px auto 12px' }} />
            <p style={S.intro}>
              <span style={{ color:'#FFD700' }}>{starterName}</span> won the toss and picks first.
              Here is how this round plays out.
            </p>
          </div>

          <div style={S.grid}>
            {RULES.map((r, i) => (
              <div key={i} style={S.ruleCard} className="fade-in"
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,215,0,0.35)'; e.currentTarget.style.transform='translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,215,0,0.08)'; e.currentTarget.style.transform='translateY(0)' }}
              >
                <span style={S.ruleIcon}>{r.icon}</span>
                <div>
                  <div style={S.ruleLabel}>{r.label}</div>
                  <div style={S.ruleDetail}>{r.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={S.scoreWrap}>
            <div style={S.scoreTitle}>Score at a Glance</div>
            <div style={S.scoreRow}>
              {SCORING.map((s,i) => (
                <div key={i} style={S.scoreCard}>
                  <span style={{ ...S.scorePoints, color:s.color }}>{s.points}</span>
                  <span style={S.scoreLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            className="btn-gold"
            style={{ fontSize:15, padding:'20px 64px', marginTop:8 }}
            onClick={() => setPhase('categorySelect')}
          >
            Start Round 01 →
          </button>
        </div>
      </div>
    </>
  )
}

const S = {
  page: { minHeight:'100vh', background:'#0A0A0F', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 24px 48px', position:'relative' },
  wrap: { width:'100%', maxWidth:780, display:'flex', flexDirection:'column', gap:28 },
  header: { textAlign:'center' },
  badge: { display:'inline-block', fontSize:11, fontWeight:600, letterSpacing:5, color:'#FFA500', border:'1px solid rgba(255,165,0,0.3)', borderRadius:9999, padding:'6px 20px', marginBottom:12, fontFamily:'Inter,sans-serif' },
  roundName: { fontFamily:"'Playfair Display',serif", fontSize:44, fontWeight:900, color:'#FFD700', letterSpacing:2, textShadow:'0 0 60px rgba(255,215,0,0.12)' },
  intro: { fontSize:14, color:'#777', marginTop:8 },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  ruleCard: {
    background:'rgba(18,18,31,0.9)', border:'1px solid rgba(255,215,0,0.08)',
    borderRadius:16, padding:'20px 22px', display:'flex', gap:14, alignItems:'flex-start',
    transition:'border-color 0.25s ease, transform 0.25s ease', cursor:'default',
    boxShadow:'0 2px 16px rgba(0,0,0,0.3)',
  },
  ruleIcon: { fontSize:15, color:'#FFD700', opacity:0.6, marginTop:2, flexShrink:0 },
  ruleLabel: { fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:'#E8E8E8', marginBottom:4 },
  ruleDetail: { fontSize:12.5, color:'#666', lineHeight:1.65 },
  scoreWrap: { background:'rgba(18,18,31,0.9)', border:'1px solid rgba(255,215,0,0.1)', borderRadius:18, padding:'22px 28px', boxShadow:'0 2px 16px rgba(0,0,0,0.3)' },
  scoreTitle: { fontSize:10, letterSpacing:4, color:'#555', textTransform:'uppercase', textAlign:'center', marginBottom:16, fontFamily:'Inter,sans-serif' },
  scoreRow: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 },
  scoreCard: { display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'14px 8px', background:'#0A0A0F', borderRadius:12, border:'1px solid rgba(255,255,255,0.03)' },
  scorePoints: { fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900 },
  scoreLabel: { fontSize:10.5, color:'#555', textAlign:'center', lineHeight:1.3 },
}
