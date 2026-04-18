import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { sounds } from '../utils/sounds'

export default function TeamEntryPage() {
  const { teams, setTeams, setPhase } = useGame()
  const [t1, setT1] = useState(() => teams.team1 || '')
  const [t2, setT2] = useState(() => teams.team2 || '')
  const [errors, setErrors] = useState({})

  const handleNamesContinue = () => {
    const e = {}
    if (!t1.trim()) e.t1 = 'Required'
    if (!t2.trim()) e.t2 = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }
    const names = { team1: t1.trim(), team2: t2.trim() }
    setTeams(names)
    sounds.teamReady()
    setTimeout(() => setPhase('toss'), 100)
  }


  return (
    <div style={S.page}>
      {['tl','tr','bl','br'].map(p => <div key={p} className={`corner-bracket corner-bracket--${p}`} />)}
      <div style={S.card} className="fade-in">
        <div style={S.logoSmall}>QUIZZERIA</div>
        <div className="gold-line" style={{ marginBottom:28 }} />
        <h1 style={S.title}>Who's Playing Tonight?</h1>
        <p style={S.sub}>Enter your team names to begin</p>

        <div style={S.fields}>
          <TeamInput label="Team 1" value={t1}
            onChange={v => { setT1(v); setErrors(e=>({...e,t1:''})) }}
            error={errors.t1} placeholder="e.g. The Legends" color="#FFD700"
          />
          <div style={S.vsWrap}>
            <div style={S.vsLine} />
            <span style={S.vs}>VS</span>
            <div style={S.vsLine} />
          </div>
          <TeamInput label="Team 2" value={t2}
            onChange={v => { setT2(v); setErrors(e=>({...e,t2:''})) }}
            error={errors.t2} placeholder="e.g. The Champions" color="#FFA500"
          />
        </div>

        <button className="btn-gold" onClick={handleNamesContinue} style={{ marginTop:8 }}>
          Confirm Teams
        </button>
      </div>
    </div>
  )
}

function TeamInput({ label, value, onChange, error, placeholder, color }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={S.inputGroup}>
      <label style={{ ...S.label, color }}>{label}</label>
      <input
        style={{
          ...S.input,
          borderColor: error ? '#EF4444' : focused ? color : 'rgba(255,255,255,0.08)',
          boxShadow: focused ? `0 0 0 3px ${color}18, 0 4px 16px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.2)',
        }}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        maxLength={24}
      />
      {error && <span style={{ fontSize:11, color:'#EF4444', paddingLeft:4 }}>{error}</span>}
    </div>
  )
}

const S = {
  page: { minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative' },
  card: {
    background:'rgba(18,18,31,0.97)',
    border:'1px solid rgba(255,215,0,0.15)',
    borderRadius:26, padding:'48px 52px',
    width:'100%', maxWidth:500,
    boxShadow:'0 8px 64px rgba(0,0,0,0.7), 0 1px 0 rgba(255,215,0,0.08), inset 0 1px 0 rgba(255,255,255,0.02)',
    display:'flex', flexDirection:'column', alignItems:'center', gap:10,
  },
  logoSmall: { fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, letterSpacing:6, color:'rgba(255,215,0,0.5)', marginBottom:14 },
  title: { fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'var(--text-primary)', textAlign:'center', marginBottom:6 },
  sub: { fontSize:13, color:'#666', textAlign:'center', marginBottom:28 },
  fields: { width:'100%', display:'flex', flexDirection:'column', marginBottom:28 },
  inputGroup: { display:'flex', flexDirection:'column', gap:8, width:'100%' },
  label: { fontSize:11, fontWeight:600, letterSpacing:3, textTransform:'uppercase' },
  input: {
    background:'#0A0A14', border:'1.5px solid',
    borderRadius:14, padding:'15px 20px',
    fontSize:17, fontFamily:"'Playfair Display',serif", fontWeight:600,
    color:'var(--text-primary)', outline:'none', width:'100%',
    transition:'border-color 0.2s ease, box-shadow 0.25s ease',
  },
  vsWrap: { display:'flex', alignItems:'center', gap:16, padding:'18px 0' },
  vsLine: { flex:1, height:1, background:'rgba(255,215,0,0.08)' },
  vs: { fontFamily:"'Playfair Display',serif", fontSize:12, fontWeight:700, letterSpacing:4, color:'rgba(255,215,0,0.2)' },
  tossBtn: {
    flex:1, border:'1.5px solid', borderRadius:18, padding:'28px 16px',
    cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8,
    transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', position:'relative',
  },
  tossCheck: {
    position:'absolute', top:10, right:14,
    fontSize:14, color:'currentColor',
    animation:'scorePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  tossMsg: {
    marginTop:16, fontSize:14, color:'#888', textAlign:'center',
    padding:'12px 24px', background:'rgba(255,215,0,0.04)',
    border:'1px solid rgba(255,215,0,0.1)', borderRadius:12,
  },
}
