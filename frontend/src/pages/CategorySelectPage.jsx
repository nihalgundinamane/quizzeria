import { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import ScoreBar from '../components/common/ScoreBar'
import SaveButton from '../components/common/SaveButton'
import SubRoundLandingPage from './SubRoundLandingPage'
import { api } from '../services/api'
import { sounds } from '../utils/sounds'

const CATEGORIES = [
  { id:'gk',           label:'Sarvagna',          kn:'ಸರ್ವಜ್ಞ',          sub:'General Knowledge',  color:'#FFD700', icon:'🌍', count:30 },
  { id:'karnataka',    label:'Namma Nadu',         kn:'ನಮ್ಮ ನಾಡು',         sub:'Karnataka',          color:'#FFA500', icon:'🏛️', count:30 },
  { id:'science',      label:"Einstein's Corner",  kn:'ಐನ್ಸ್ಟೈನ್ ಕಾರ್ನರ್', sub:'Science',            color:'#5DCAA5', icon:'⚗️', count:30 },
  { id:'technology',   label:'Tech Titans',        kn:'ಟೆಕ್ ಟೈಟನ್ಸ್',     sub:'Technology',         color:'#85B7EB', icon:'💻', count:30 },
  { id:'sports',       label:'Arena',              kn:'ಆರೀನಾ',             sub:'Sports & Cricket',   color:'#ED93B1', icon:'🏏', count:30 },
  { id:'geography',    label:'Terra Firma',        kn:'ಟೆರ್ರಾ ಫರ್ಮಾ',     sub:'Geography',          color:'#AFA9EC', icon:'🗺️', count:30 },
  { id:'history',      label:'Itihaas',            kn:'ಇತಿಹಾಸ',            sub:'History',            color:'#EF9F27', icon:'📜', count:30 },
  { id:'food_culture', label:'Ruchi & Sanskriti',  kn:'ರುಚಿ & ಸಂಸ್ಕೃತಿ',  sub:'Food & Culture',     color:'#F0997B', icon:'🍛', count:30 },
  { id:'ramayana',     label:'Raama Katha',        kn:'ರಾಮ ಕಥೆ',           sub:'Ramayana',           color:'#C084FC', icon:'🏹', count:30 },
  { id:'mahabharata',  label:'Kurukshetra',        kn:'ಕುರುಕ್ಷೇತ್ರ',       sub:'Mahabharata',        color:'#F87171', icon:'⚔️', count:30 },
]

export default function CategorySelectPage() {
  const {
    teams, categoryIndex, startNewCategory, categoryStartTeam,
    completedCategories, setPhase, markRoundDone, scores
  } = useGame()

  const [hov, setHov]               = useState(null)
  const [selected, setSelected]     = useState(null)
  const [backendCats, setBackendCats] = useState([])
  const [catLanding, setCatLanding] = useState(false)
  const [pendingCat, setPendingCat] = useState(null)
  const [pendingIdx, setPendingIdx] = useState(null)
  const [bgAccent,  setBgAccent]    = useState(null)   // B1: colour wash
  const [flippedCards, setFlippedCards] = useState(new Set()) // B2: reveal drama

  useEffect(() => {
    api.getR01Categories()
      .then(d => setBackendCats(d.categories || []))
      .catch(() => {}) // silent fail — UI works from hardcoded array
  }, [])

  // Merge backend count into CATEGORIES if available
  const mergedCats = CATEGORIES.map(cat => {
    const bc = backendCats.find(b => b.id === cat.id)
    return bc ? { ...cat, count: bc.count } : cat
  })

  const starterTeam  = categoryStartTeam(categoryIndex)
  const starterName  = starterTeam === 1 ? teams.team1 : teams.team2
  const starterColor = starterTeam === 1 ? '#FFD700' : '#FFA500'
  const doneCount    = completedCategories.size
  const allDone      = doneCount >= CATEGORIES.length

  const handleSelect = (cat, idx) => {
    if (completedCategories.has(cat.id) || selected) return
    sounds.subWhoosh()
    setSelected(cat.id)
    setBgAccent(cat.color)          // B1: colour wash
    setPendingCat(cat)
    setPendingIdx(idx)

    // B2: flip all OTHER cards face-down one by one, then zoom selected
    const others = mergedCats
      .map((c, i) => i)
      .filter(i => mergedCats[i].id !== cat.id)
    others.forEach((cardIdx, order) => {
      setTimeout(() => {
        setFlippedCards(prev => new Set([...prev, cardIdx]))
      }, order * 80)
    })
    // After all others flip, go to landing
    setTimeout(() => setCatLanding(true), others.length * 80 + 420)
  }

  // Show cinematic landing for selected category
  if (catLanding && pendingCat) {
    const taglines = {
      gk:          'The world in thirty questions. Facts from every corner.',
      karnataka:   'Namma Nadu. Namma Hesaru. Our land, our pride.',
      science:     'From atoms to galaxies — how well do you know the universe?',
      technology:  'Code, circuits and innovation. The world of tech awaits.',
      sports:      'Cricket, champions and glory. Step into the arena.',
      geography:   'Mountains, rivers, capitals. Navigate the world.',
      history:     'From ancient kingdoms to modern revolutions. Know the past.',
      food_culture:'Recipes, traditions and flavours. Taste the culture.',
      ramayana:    'The epic of Rama. Honour, devotion and dharma.',
      mahabharata: 'The great war of Kurukshetra. Whose side are you on?',
    }
    return (
      <SubRoundLandingPage
        accent={pendingCat.color}
        tag={`ROUND 01 · ${pendingCat.sub.toUpperCase()}`}
        title={pendingCat.label}
        titleKn={pendingCat.kn}
        sub={pendingCat.sub}
        tagline={taglines[pendingCat.id] || '30 questions · test your knowledge'}
        icon={pendingCat.icon}
        backLabel="← Categories"
        onBack={() => { setCatLanding(false); setSelected(null); setPendingCat(null); setBgAccent(null); setFlippedCards(new Set()) }}
        onContinue={() => { setCatLanding(false); startNewCategory(pendingCat, pendingIdx) }}
      />
    )
  }

  return (
    <>
      <ScoreBar />
      <div style={{ ...S.page, background: bgAccent
          ? `radial-gradient(ellipse at 50% 30%, ${bgAccent}12 0%, #0A0A0F 55%)`
          : '#0A0A0F',
        transition: 'background 0.9s ease' }}>
        {['tl','tr','bl','br'].map(p => <div key={p} className={`corner-bracket corner-bracket--${p}`} />)}

        <div style={S.wrap} className="fade-in">

          {/* ── Header ── */}
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => setPhase('roundSelect')}>← All Rounds</button>
            <div style={S.pill}>ROUND 01 · CATEGORY CLASH</div>
            <h1 style={S.title}>Pick Your Battlefield</h1>
            <div className="gold-line" style={{ margin:'10px auto 14px' }} />

            {/* Score row */}
            <div style={S.scoreRow}>
              <span style={{ color:'#FFD700', fontWeight:700, fontSize:15 }}>{teams.team1}</span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:'#FFD700' }}>{scores.team1}</span>
              <span style={{ color:'rgba(255,255,255,0.2)', fontSize:12 }}>vs</span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:'#FFA500' }}>{scores.team2}</span>
              <span style={{ color:'#FFA500', fontWeight:700, fontSize:15 }}>{teams.team2}</span>
            </div>

            {/* Turn indicator + save */}
            <div style={{display:'flex',alignItems:'center',gap:12,width:'100%',maxWidth:560}}>
              <div style={{ ...S.turnChip, borderColor:`${starterColor}40`, flex:1 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:starterColor, boxShadow:`0 0 10px ${starterColor}` }} />
                <span style={{ color:starterColor, fontWeight:700 }}>{starterName}</span>
                <span style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>— choose a category</span>
                <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.25)', fontSize:11 }}>{doneCount}/10 done</span>
              </div>
              <SaveButton />
            </div>
          </div>

          {/* ── Category grid ── */}
          <div style={S.grid}>
            {mergedCats.map((cat, idx) => {
              const done      = completedCategories.has(cat.id)
              const isHov     = hov === cat.id
              const isSel     = selected === cat.id
              const isFlipped = flippedCards.has(idx) && !isSel  // B2: flipped face-down

              return (
                <button
                  key={cat.id}
                  style={{
                    ...S.card,
                    // B2: flip animation for non-selected cards
                    animation: isFlipped ? 'cardFlipOut 0.35s ease forwards' : 'none',
                    // B2: selected card zooms
                    transform: isSel && flippedCards.size > 0
                      ? 'scale(1.08)'
                      : isSel ? 'scale(0.96)'
                      : isHov && !done ? 'translateY(-5px) scale(1.02)' : 'scale(1)',
                    borderColor: done ? 'rgba(34,197,94,0.35)'
                      : isSel ? cat.color
                      : isHov ? `${cat.color}60` : `${cat.color}18`,
                    background: done
                      ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))'
                      : isSel
                        ? `linear-gradient(135deg, ${cat.color}28, ${cat.color}10)`
                        : isHov
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))'
                          : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    boxShadow: isSel && flippedCards.size > 0
                      ? `0 0 48px ${cat.color}40, 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)`
                      : done
                        ? '0 0 24px rgba(34,197,94,0.1), inset 0 1px 0 rgba(255,255,255,0.04)'
                        : isHov && !done
                          ? `0 16px 40px ${cat.color}18, inset 0 1px 0 rgba(255,255,255,0.06)`
                          : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                    cursor: done || !!selected ? (done ? 'default' : 'not-allowed') : 'pointer',
                    opacity: isFlipped ? undefined : (selected && selected !== cat.id ? 0.45 : 1),
                    transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease',
                    zIndex: isSel ? 10 : 1,
                  }}
                  onClick={() => handleSelect(cat, idx)}
                  onMouseEnter={() => !done && !selected && setHov(cat.id)}
                  onMouseLeave={() => setHov(null)}
                >
                  {/* Done checkmark */}
                  {done && (
                    <div style={{ position:'absolute', top:10, right:10, width:22, height:22, borderRadius:'50%', background:'#22C55E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:700, animation:'checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>✓</div>
                  )}

                  {/* Icon */}
                  <div style={{ fontSize:28, lineHeight:1, marginBottom:6, filter: done ? 'grayscale(0.4)' : 'none' }}>{cat.icon}</div>

                  {/* Label */}
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color: done ? 'rgba(34,197,94,0.85)' : isHov || isSel ? '#F5F5F5' : 'rgba(240,240,240,0.85)', lineHeight:1.2, marginBottom:3 }}>
                    {cat.label}
                  </div>

                  {/* Kannada */}
                  <div style={{ fontSize:12, color: done ? 'rgba(34,197,94,0.55)' : `${cat.color}88`, fontFamily:'sans-serif', marginBottom:4 }}>
                    {cat.kn}
                  </div>

                  {/* Sub */}
                  <div style={{ fontSize:10, letterSpacing:1, color: done ? 'rgba(34,197,94,0.5)' : `${cat.color}55`, fontFamily:'Inter,sans-serif', textTransform:'uppercase' }}>
                    {done ? 'Completed ✓' : cat.sub}
                  </div>

                  {/* Q count */}
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.15)', fontFamily:'Inter,sans-serif', marginTop:4 }}>
                    {cat.count} questions
                  </div>

                  {/* Bottom accent line */}
                  {!done && (
                    <div style={{ position:'absolute', bottom:0, left:12, right:12, height:2, borderRadius:1, background:`linear-gradient(90deg, transparent, ${cat.color}${isHov?'55':'22'}, transparent)`, transition:'all 0.3s ease' }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Complete CTA ── */}
          {allDone && (
            <div style={{ textAlign:'center', animation:'fadeUp 0.5s ease forwards', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', fontFamily:'Inter,sans-serif' }}>
                All categories complete!
              </div>
              <button className="btn-gold"
                style={{ borderColor:'rgba(255,215,0,0.5)', color:'#FFD700' }}
                onClick={() => { markRoundDone(1); setPhase('roundSelect') }}>
                ✓ Round Complete — Back to Rounds
              </button>
              <SaveButton />
            </div>
          )}
          {/* Save button always visible while playing R01 */}
          {!allDone && doneCount > 0 && (
            <div style={{ display:'flex', justifyContent:'center' }}>
              <SaveButton />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const S = {
  page:     { minHeight:'100vh', background:'#0A0A0F', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', padding:'72px 24px 48px', position:'relative' },
  wrap:     { width:'100%', maxWidth:1020, display:'flex', flexDirection:'column', gap:28 },
  header:   { display:'flex', flexDirection:'column', alignItems:'center', gap:10 },
  backBtn:  { alignSelf:'flex-start', background:'none', border:'none', color:'rgba(255,215,0,0.3)', fontSize:12, letterSpacing:1, cursor:'pointer', fontFamily:'Inter,sans-serif', padding:0, marginBottom:4 },
  pill:     { fontSize:10, fontWeight:700, letterSpacing:4, color:'rgba(255,215,0,0.45)', fontFamily:'Inter,sans-serif', textTransform:'uppercase' },
  title:    { fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:900, color:'#FFD700', textAlign:'center', letterSpacing:1 },
  scoreRow: { display:'flex', alignItems:'center', gap:16, background:'rgba(255,255,255,0.03)', borderRadius:9999, padding:'8px 24px', border:'1px solid rgba(255,255,255,0.06)' },
  turnChip: { display:'flex', alignItems:'center', gap:10, border:'1.5px solid', borderRadius:9999, padding:'9px 20px', fontFamily:"'Playfair Display',serif", fontSize:14, background:'rgba(14,14,26,0.8)', backdropFilter:'blur(20px)', width:'100%', maxWidth:520 },
  grid:     { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 },
  card:     { position:'relative', overflow:'hidden', border:'1px solid', borderRadius:18, padding:'22px 14px 18px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:0, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', outline:'none' },
}
