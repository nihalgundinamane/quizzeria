import { useState, useEffect, useCallback } from 'react'
import { useGame } from '../../context/GameContext'

const ROUNDS = [1,2,3,4,5,6,7,8]
const ROUND_NAMES = {
  1:'Category Clash', 2:'The Visual Vault', 3:'The Wild Card',
  4:'Buzzer Battle',  5:'Agni Pariksha',    6:'Pen & Power',
  7:'Decode Zone',    8:'The Final Frontier',
}

export default function AdminPanel() {
  const { teams, scores, addScore, setPhase, completedRounds, markRoundDone, resetGame } = useGame()

  const [open,  setOpen]  = useState(false)
  const [adj1,  setAdj1]  = useState('')
  const [adj2,  setAdj2]  = useState('')
  const [toast, setToast] = useState('')
  const [tab,   setTab]   = useState('scores')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  const handleKey = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') { e.preventDefault(); setOpen(o => !o) }
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const applyAdj = (team, raw) => {
    const n = parseInt(raw, 10)
    if (isNaN(n)) return
    addScore(team, n)
    showToast(`${team === 1 ? teams.team1 : teams.team2}: ${n > 0 ? '+' : ''}${n} pts applied`)
    team === 1 ? setAdj1('') : setAdj2('')
  }

  if (!open) return null

  return (
    <>
      <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(6px)', zIndex:9000 }} />

      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(160deg, #10101e 0%, #0c0c18 100%)',
        border: '1.5px solid rgba(239,68,68,0.45)', borderRadius: 28, padding: '36px 40px',
        width: 'min(720px, 96vw)', maxHeight: '90vh', overflowY: 'auto', zIndex: 9001,
        boxShadow: '0 32px 100px rgba(0,0,0,0.95), 0 0 60px rgba(239,68,68,0.06)',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:5, color:'rgba(239,68,68,0.75)', fontFamily:'Inter,sans-serif', marginBottom:6, textTransform:'uppercase' }}>
              🔐 Admin · Quizmaster Panel
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'#F0F0F0' }}>
              Score Override & Controls
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)', fontFamily:'Inter,sans-serif', marginTop:4 }}>
              Ctrl + Shift + A to toggle · ESC to close
            </div>
          </div>
          <button onClick={() => setOpen(false)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'8px 16px', color:'#EF4444', cursor:'pointer', fontSize:13, fontFamily:'Inter,sans-serif', fontWeight:600, flexShrink:0 }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}>
            ✕ Close
          </button>
        </div>

        {/* Scoreboard strip */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, background:'rgba(255,255,255,0.03)', borderRadius:16, padding:'16px 24px', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:12, color:'#FFD700', fontFamily:'Inter,sans-serif', fontWeight:700, marginBottom:4 }}>{teams.team1 || 'Team 1'}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:40, fontWeight:900, color:'#FFD700', lineHeight:1 }}>{scores.team1}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', fontSize:18, color:'rgba(255,255,255,0.2)' }}>vs</div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:12, color:'#FFA500', fontFamily:'Inter,sans-serif', fontWeight:700, marginBottom:4 }}>{teams.team2 || 'Team 2'}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:40, fontWeight:900, color:'#FFA500', lineHeight:1 }}>{scores.team2}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, background:'rgba(255,255,255,0.04)', borderRadius:14, padding:5 }}>
          {[['scores','📊 Scores'],['rounds','🏆 Rounds'],['navigate','🗺️ Navigate'],['system','⚙️ System']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:'10px 0', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600, background:tab===id?'rgba(239,68,68,0.2)':'transparent', color:tab===id?'#EF4444':'rgba(255,255,255,0.35)', transition:'all 0.2s ease' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Scores tab */}
        {tab === 'scores' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', fontFamily:'Inter,sans-serif' }}>Click quick buttons or enter a custom ±value and press Apply.</div>
            {[1, 2].map(n => {
              const name = n===1?teams.team1:teams.team2; const color = n===1?'#FFD700':'#FFA500'
              const score = n===1?scores.team1:scores.team2; const adj = n===1?adj1:adj2; const setAdj = n===1?setAdj1:setAdj2
              return (
                <div key={n} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${color}18`, borderRadius:16, padding:'20px 22px', display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color }}>{name||`Team ${n}`}</div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:900, color }}>{score}</div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {[-50,-20,-10,-5,5,10,20,50,100].map(v => (
                      <button key={v} onClick={() => { addScore(n,v); showToast(`${name}: ${v>0?'+':''}${v} pts`) }}
                        style={{ padding:'8px 14px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Inter,sans-serif', background:v<0?'rgba(239,68,68,0.14)':'rgba(34,197,94,0.12)', color:v<0?'#EF4444':'#22C55E' }}
                        onMouseEnter={e=>e.currentTarget.style.opacity='0.7'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                        {v>0?'+':''}{v}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <input type="number" value={adj} onChange={e=>setAdj(e.target.value)} onKeyDown={e=>e.key==='Enter'&&applyAdj(n,adj)} placeholder="Custom ±value (e.g. +25 or -15)"
                      style={{ flex:1, background:'#08080f', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'11px 16px', color:'#F0F0F0', fontFamily:'Inter,sans-serif', fontSize:14, outline:'none' }}/>
                    <button onClick={()=>applyAdj(n,adj)} style={{ padding:'11px 22px', borderRadius:10, cursor:'pointer', background:`${color}18`, border:`1px solid ${color}44`, color, fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:700, whiteSpace:'nowrap' }}>Apply</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Rounds tab */}
        {tab === 'rounds' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', fontFamily:'Inter,sans-serif' }}>Click to mark a round complete.</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {ROUNDS.map(r => {
                const done = completedRounds.has(r)
                return (
                  <button key={r} onClick={() => { if(!done){markRoundDone(r);showToast(`Round ${r}: ${ROUND_NAMES[r]} marked complete`)} }}
                    style={{ padding:'14px 18px', borderRadius:14, cursor:done?'default':'pointer', border:`1px solid ${done?'rgba(34,197,94,0.4)':'rgba(255,255,255,0.08)'}`, background:done?'rgba(34,197,94,0.08)':'rgba(255,255,255,0.03)', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'Inter,sans-serif', fontSize:13, color:done?'#22C55E':'rgba(255,255,255,0.6)' }}>
                    <div>
                      <div style={{ fontSize:10, opacity:0.5, marginBottom:2 }}>Round {String(r).padStart(2,'0')}</div>
                      <div style={{ fontWeight:600 }}>{ROUND_NAMES[r]}</div>
                    </div>
                    <span style={{ fontSize:18 }}>{done?'✓':'○'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Navigate tab */}
        {tab === 'navigate' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', fontFamily:'Inter,sans-serif' }}>Jump directly to any screen instantly.</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                {label:'🏠 Landing Page',color:'#85B7EB',phase:'landing'},
                {label:'👥 Team Entry',color:'#85B7EB',phase:'teamEntry'},
                {label:'🎲 Toss Page',color:'#FFA500',phase:'toss'},
                {label:'📋 Round Select',color:'#38BDF8',phase:'roundSelect'},
                {label:'📂 Category Select',color:'#FFD700',phase:'categorySelect'},
                {label:'⏱ Halftime Screen',color:'#5DCAA5',phase:'halftime'},
                {label:'🏆 Winner Screen',color:'#FFD700',phase:'winner'},
                {label:'📜 Rules Page',color:'#C084FC',phase:'rules'},
              ].map(btn => (
                <button key={btn.phase} onClick={() => { setPhase(btn.phase); setOpen(false); showToast(`Navigated → ${btn.label}`) }}
                  style={{ padding:'14px 18px', borderRadius:14, cursor:'pointer', border:`1px solid ${btn.color}28`, background:`${btn.color}08`, color:btn.color, fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600, textAlign:'left' }}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${btn.color}16`;e.currentTarget.style.borderColor=`${btn.color}55`}}
                  onMouseLeave={e=>{e.currentTarget.style.background=`${btn.color}08`;e.currentTarget.style.borderColor=`${btn.color}28`}}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* System tab */}
        {tab === 'system' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', fontFamily:'Inter,sans-serif' }}>⚠️ Danger zone — some actions cannot be undone.</div>
            <button onClick={() => { resetGame(); setOpen(false) }}
              style={{ padding:'18px 22px', borderRadius:14, cursor:'pointer', border:'1px solid rgba(239,68,68,0.35)', background:'rgba(239,68,68,0.08)', color:'#EF4444', fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:600, textAlign:'left', display:'flex', flexDirection:'column', gap:4 }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.16)';e.currentTarget.style.borderColor='rgba(239,68,68,0.65)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.08)';e.currentTarget.style.borderColor='rgba(239,68,68,0.35)'}}>
              <span>🔄 Full Reset — Start New Game</span>
              <span style={{ fontSize:11, opacity:0.55, fontWeight:400 }}>Clears all scores, progress, teams</span>
            </button>
            <div style={{ marginTop:8, padding:'16px 18px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14 }}>
              <div style={{ fontSize:11, letterSpacing:2, color:'rgba(255,255,255,0.2)', fontFamily:'Inter,sans-serif', textTransform:'uppercase', marginBottom:10 }}>Session Info</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[['Team 1',teams.team1||'—'],['Team 2',teams.team2||'—'],['Scores',`${scores.team1} vs ${scores.team2}`],['Rounds Done',`${completedRounds.size}/8`]].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontFamily:'Inter,sans-serif' }}>
                    <span style={{ color:'rgba(255,255,255,0.3)' }}>{k}</span>
                    <span style={{ color:'rgba(255,255,255,0.7)', fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:36, left:'50%', transform:'translateX(-50%)', background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.4)', borderRadius:9999, padding:'12px 28px', color:'#22C55E', fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:600, zIndex:9002, backdropFilter:'blur(20px)', whiteSpace:'nowrap' }}>
          ✓ {toast}
        </div>
      )}
    </>
  )
}
