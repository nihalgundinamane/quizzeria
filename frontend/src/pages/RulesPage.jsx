import { useGame } from '../context/GameContext'
import ScoreBar from '../components/common/ScoreBar'

/* ── Rules data for all rounds ────────────────────────────────── */
const RULES = {
  1: {
    accent: '#FFD700', num: 'Round 01', name: 'Category Clash',
    tagline: 'Ten categories. Thirty questions each. One winner.',
    overview: 'Teams take turns answering questions from 10 different categories. Each question is answered verbally — the Quizmaster judges correctness. Options can be revealed for a lower score.',
    sections: [
      {
        title: 'Format',
        items: [
          '10 categories · 30 questions each',
          'Teams alternate turns across questions within each category',
          'Toss winner picks the starting team for the first category',
          'All questions are bilingual — English and Kannada displayed together',
        ]
      },
      {
        title: 'Scoring',
        table: [
          { action: 'Correct answer — no options shown', pts: '+20', color: '#22C55E' },
          { action: 'Correct answer — with options shown', pts: '+10', color: '#FFA500' },
          { action: 'Correct on pass (other team)', pts: '+5', color: '#5DCAA5' },
          { action: 'Wrong answer — no options shown', pts: '−10', color: '#EF4444' },
          { action: 'Wrong answer — with options shown', pts: '0', color: 'rgba(255,255,255,0.4)' },
        ]
      },
      {
        title: 'Flow',
        items: [
          'Select a category from the board',
          'Team whose turn it is answers verbally — Quizmaster taps ✓ or ✕',
          'On wrong answer, the opposing team gets a pass opportunity',
          '"Show Options" reveals 4 choices and starts a 30-second timer',
          'Hint can be used at any time for a clue',
          'All 10 categories must be completed to finish the round',
        ]
      }
    ]
  },
  2: {
    accent: '#85B7EB', num: 'Round 02', name: 'The Visual Vault',
    tagline: 'Shadow images. Sharp eyes. 30 seconds.',
    overview: 'A shadow silhouette of a logo, animal, celebrity or cricket player is revealed on screen. Teams must identify it before the clock runs out — no options, just your eyes and instincts.',
    sections: [
      {
        title: 'Categories — 20 questions each',
        items: [
          'Chihn Grahana / ಚಿಹ್ನೆ ಗ್ರಹಣ — Brand Logos',
          'Vanya Darshana / ವನ್ಯ ದರ್ಶನ — Wild Animals',
          'Nayaka Drushya / ನಾಯಕ ದೃಶ್ಯ — Indian Artists',
          'Devara Pratibimba / ದೇವರ ಪ್ರತಿಬಿಂಬ — Gods & Deities',
          'Krida Veerana / ಕ್ರೀಡಾ ವೀರಾ — Indian Cricketers',
        ]
      },
      {
        title: 'Scoring',
        table: [
          { action: 'Correct answer — primary team', pts: '+10', color: '#22C55E' },
          { action: 'Correct on pass — opposing team', pts: '+5', color: '#5DCAA5' },
          { action: 'Wrong answer', pts: '0', color: 'rgba(255,255,255,0.4)' },
        ]
      },
      {
        title: 'Rules',
        items: [
          '10 questions per team per category (alternating)',
          'Shadow image revealed — 30 second timer starts immediately',
          'No options shown at any point',
          'On wrong answer, the other team gets a pass attempt for +5',
          'No negative marking in this round',
        ]
      }
    ]
  },
  3: {
    accent: '#C084FC', num: 'Round 03', name: 'The Wild Card',
    tagline: 'Smart. Funny. Twisted. Anything goes.',
    overview: 'Six sub-categories of lateral-thinking, wordplay, riddles and fun questions. This round tests creativity as much as knowledge.',
    sections: [
      {
        title: 'Sub-Categories',
        items: [
          'Gade Mathu / ಗಾದೆ ಮಾತು — Kannada Proverbs',
          'Vagatu Vichar / ವಗಟು ವಿಚಾರ — Lateral Riddles',
          'Padagalu Thiruku / ಪದ ಅಡಗಿದ — Jumbled Words',
          'Sur Saga / ಸುರ ಸಾಗ — Song Identification',
          'Hasi & Hushaar / ಹಾಸ್ಯ & ಹುಷಾರ — Smart Funny Questions',
          'Nudi Bhavana / ನುಡಿ ಭಾವನ — English → Kannada Translation',
        ]
      },
      {
        title: 'Scoring',
        items: [
          'Points system varies per sub-category',
          'Quizmaster announces scoring before each sub-category begins',
          'No negative marking across any sub-category',
        ]
      }
    ]
  },
  4: {
    accent: '#F87171', num: 'Round 04', name: 'Buzzer Battle',
    tagline: 'First to buzz. Fastest wins.',
    overview: 'Speed and knowledge collide. The Quizmaster reads each question aloud — first team to buzz in gets to answer. A wrong answer passes to the other team for a bonus attempt.',
    sections: [
      {
        title: 'Format',
        items: [
          '50 questions — played straight through, no category selection',
          'Quizmaster reads the question aloud first',
          'First team to buzz in gets to answer verbally',
          'Timer only starts if "Show Options" is clicked — options reduce the score',
          '30-second timer runs after options are shown',
          'A wrong answer passes to the opposing team for a +5 bonus attempt',
        ]
      },
      {
        title: 'Scoring',
        table: [
          { action: 'Correct — no options shown', pts: '+20', color: '#22C55E' },
          { action: 'Correct — with options shown', pts: '+10', color: '#FFA500' },
          { action: 'Correct on pass (no options)', pts: '+5', color: '#5DCAA5' },
          { action: 'Wrong — no options (buzzer penalty)', pts: '−10', color: '#EF4444' },
          { action: 'Wrong — with options', pts: '0', color: 'rgba(255,255,255,0.4)' },
        ]
      },
      {
        title: 'Flow',
        items: [
          'Quizmaster reads question → Team buzzes in → Tap the team that buzzed first',
          'Team answers verbally → Quizmaster taps ✓ or ✕',
          'Wrong answer without options = −10 and pass to other team',
          '"Show Options" reveals 4 choices and starts the 30-second countdown',
          'Hints are available at any time for a bilingual clue',
        ]
      }
    ]
  },
  5: {
    accent: '#FB923C', num: 'Round 05', name: 'Agni Pariksha',
    tagline: 'Twenty questions. Ten minutes. No mercy.',
    overview: 'A timed rapid-fire round. Each team gets 10 minutes to answer their set of 20 questions. Speed and accuracy both count — but there is no negative marking.',
    sections: [
      {
        title: 'Format',
        items: [
          '20 questions per team (Set 1 for Team A, Set 2 for Team B)',
          'Toss winner goes first',
          '10-minute countdown per team',
          'Questions auto-advance — answer as many as possible',
        ]
      },
      {
        title: 'Scoring',
        table: [
          { action: 'Correct answer', pts: '+10', color: '#22C55E' },
          { action: 'Wrong or skipped', pts: '0', color: 'rgba(255,255,255,0.4)' },
        ]
      },
      {
        title: 'Rules',
        items: [
          'No passing — each question is owned by the active team',
          'No negative marking in this round',
          'Timer runs continuously — pausing is not allowed',
          'Maximum of 20 × 10 = 200 points per team',
        ]
      }
    ]
  },
  6: {
    accent: '#34D399', num: 'Round 06', name: 'Pen & Power',
    tagline: 'Paper. Pen. Ten minutes. Write your destiny.',
    overview: 'An offline written round. Question sheets are distributed to both teams simultaneously. Both teams answer independently for 10 minutes, then sheets are collected and scored by the Quizmaster.',
    sections: [
      {
        title: 'Format',
        items: [
          'Both teams receive question sheets at the same time',
          '10-minute timer starts once all sheets are distributed',
          'Teams write answers independently — no verbal communication',
          'Sheets are collected when time is up',
          'Quizmaster reviews and enters scores manually',
        ]
      },
      {
        title: 'Scoring',
        items: [
          'Quizmaster assigns scores after reviewing answer sheets',
          'Scores are entered manually into the system after the round',
          'Points per question will be announced before the round begins',
        ]
      }
    ]
  },
  7: {
    accent: '#38BDF8', num: 'Round 07', name: 'Decode Zone',
    tagline: 'Remember the sequence. Crack the emoji.',
    overview: 'Two very different sub-rounds. First: memorise a number sequence and repeat it back. Then: decode emoji-based clues to identify words, people, games and songs.',
    sections: [
      {
        title: 'Sub-Round 1 — Krama Smarana / ಕ್ರಮ ಸ್ಮರಣ (Sequence Memory)',
        items: [
          '3 questions per team (6 total)',
          'A sequence image is shown for 15 seconds',
          'Image is hidden — team has 30 seconds to repeat the sequence verbally',
          'Team 1 completes all 3, then Team 2 takes their turn',
          'Correct = +10 points · No passing allowed',
        ]
      },
      {
        title: 'Sub-Round 2 — Moji Mania / ಮೋಜಿ ಮ್ಯಾನಿಯಾ (Emoji Word)',
        items: [
          'Padagalu ಪದಗಳು — Guess the Word from emoji',
          'Nayakaru ನಾಯಕರು — Guess the Kannada Actor from image',
          'Aathaalu ಆಟಗಳು — Guess the Game from emoji',
          'Cricketar ಕ್ರಿಕೆಟರ್ — Guess the Cricketer from image',
          'Haadu ಹಾಡು — Guess the Song from image',
          '10 questions per sub-category · 30 seconds per question',
          'Correct = +10 · Pass correct = +5 · No negative marking',
        ]
      }
    ]
  },
  8: {
    accent: '#F59E0B', num: 'Round 08', name: 'The Final Frontier',
    tagline: 'One question. Four minutes. Everything on the line.',
    overview: 'The boss round. Each team faces one complex question with four minutes on the clock. Hints are available — but each hint costs 10 points. Think carefully before you ask.',
    sections: [
      {
        title: 'Format',
        items: [
          '2 boss questions — one per team',
          'Toss winner faces Question 1',
          '4 minutes per question',
          '3 hints available per question',
          'Options revealed on demand (does not affect score)',
        ]
      },
      {
        title: 'Scoring',
        table: [
          { action: 'Correct — no hints', pts: '+100', color: '#22C55E' },
          { action: 'Correct — 1 hint used', pts: '+90', color: '#5DCAA5' },
          { action: 'Correct — 2 hints used', pts: '+80', color: '#FFA500' },
          { action: 'Correct — 3 hints used', pts: '+70', color: '#F59E0B' },
          { action: 'Wrong answer', pts: '0', color: 'rgba(255,255,255,0.4)' },
        ]
      },
      {
        title: 'Rules',
        items: [
          'No passing — the assigned team must answer',
          'No negative points at any stage',
          'Hints are revealed one at a time — each costs −10 pts from potential score',
          'Minimum possible score if correct is +70 (all 3 hints used)',
          'Timer continues running after options are shown',
        ]
      }
    ]
  },
}

export default function RulesPage() {
  const { currentRound, setPhase } = useGame()
  const r = RULES[currentRound] || RULES[1]
  const a  = r.accent

  // Which phase to go to after rules
  const NEXT = {
    1: 'categorySelect',
    2: 'round02Play',
    3: 'round03Play',
    4: 'round04Play',
    5: 'round05Play',
    6: 'round06Play',
    7: 'round07Play',
    8: 'round08Play',
  }

  return (
    <>
      <ScoreBar />
      <div style={S.page}>
        {['tl','tr','bl','br'].map(p => <div key={p} className={`corner-bracket corner-bracket--${p}`} style={{borderColor:a}} />)}

        <div style={S.wrap} className="fade-in">
          {/* Header */}
          <div style={S.header}>
            <div style={{...S.pill, borderColor:`${a}33`, color:a}}>{r.num}</div>
            <h1 style={{...S.title, color:a}}>{r.name}</h1>
            <div className="gold-line" style={{margin:'10px auto 12px'}} />
            <p style={{...S.tagline, color:`${a}77`}}>{r.tagline}</p>
          </div>

          {/* Overview */}
          <div style={{...S.overview, borderColor:`${a}22`, background:`${a}06`}}>
            <div style={{fontSize:10,letterSpacing:3,color:`${a}55`,textTransform:'uppercase',marginBottom:8,fontFamily:'Inter,sans-serif'}}>Overview</div>
            <p style={{fontSize:14,color:'rgba(255,255,255,0.55)',lineHeight:1.8,fontFamily:'Inter,sans-serif'}}>{r.overview}</p>
          </div>

          {/* Sections */}
          <div style={S.sections}>
            {r.sections.map((sec, si) => (
              <div key={si} style={S.section} className="glass-card-sm">
                <div style={{...S.sectionTitle, color:a}}>{sec.title}</div>

                {/* Table rows */}
                {sec.table && (
                  <div style={S.table}>
                    {sec.table.map((row, ri) => (
                      <div key={ri} style={{...S.tableRow, borderBottom:ri<sec.table.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                        <span style={{fontSize:13,color:'var(--text-secondary)',fontFamily:'Inter,sans-serif'}}>{row.action}</span>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:900,color:row.color}}>{row.pts}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bullet items */}
                {sec.items && (
                  <div style={S.items}>
                    {sec.items.map((item, ii) => (
                      <div key={ii} style={S.item}>
                        <div style={{...S.dot, background:a}} />
                        <span style={{fontSize:13,color:'rgba(255,255,255,0.55)',lineHeight:1.6,fontFamily:'Inter,sans-serif'}}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:8}}>
            <button style={S.backBtn} onClick={() => setPhase('roundSelect')}>← Back</button>
            <button
              style={{...S.startBtn, borderColor:`${a}55`, color:a, boxShadow:`0 8px 32px ${a}18`}}
              onClick={() => setPhase(NEXT[currentRound]||'categorySelect')}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=a;e.currentTarget.style.boxShadow=`0 14px 48px ${a}35`;e.currentTarget.style.transform='translateY(-2px) scale(1.02)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=`${a}55`;e.currentTarget.style.boxShadow=`0 8px 32px ${a}18`;e.currentTarget.style.transform='translateY(0) scale(1)'}}
            >
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,letterSpacing:2}}>Start Round</span>
              <span style={{fontSize:10,letterSpacing:2,opacity:0.5}}>Let's Go →</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const S = {
  page:    { minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'80px 24px 48px', position:'relative' },
  wrap:    { width:'100%', maxWidth:780, display:'flex', flexDirection:'column', gap:24 },
  header:  { textAlign:'center', paddingTop:8 },
  pill:    { display:'inline-block', fontSize:11, fontWeight:600, letterSpacing:5, border:'1px solid', borderRadius:9999, padding:'5px 18px', marginBottom:12, fontFamily:'Inter,sans-serif' },
  title:   { fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:900, letterSpacing:1 },
  tagline: { fontSize:13, letterSpacing:2, fontFamily:'Inter,sans-serif', marginTop:8 },
  overview:{ borderRadius:14, padding:'18px 22px', border:'1px solid' },
  sections:{ display:'flex', flexDirection:'column', gap:14 },
  section: { padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 },
  sectionTitle: { fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, letterSpacing:1, paddingBottom:10, borderBottom:'1px solid rgba(255,255,255,0.06)' },
  table:   { display:'flex', flexDirection:'column', gap:0 },
  tableRow:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0' },
  items:   { display:'flex', flexDirection:'column', gap:10 },
  item:    { display:'flex', alignItems:'flex-start', gap:12 },
  dot:     { width:5, height:5, borderRadius:'50%', flexShrink:0, marginTop:7, opacity:0.7 },
  backBtn: { background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9999, padding:'12px 24px', color:'rgba(255,255,255,0.4)', fontSize:12, letterSpacing:1, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.2s' },
  startBtn:{ background:'linear-gradient(145deg,rgba(30,30,53,0.95),rgba(18,18,31,0.95))', border:'1.5px solid', borderRadius:9999, padding:'16px 52px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)' },
}
