/**
 * SubRoundLandingPage
 * ───────────────────
 * A full-screen cinematic intro page used for every sub-round, sub-category,
 * and category landing in Quizzeria. Mirrors the exact animation sequence
 * and visual language of LandingPage + RoundIntroPage.
 *
 * Props:
 *  accent      – hex color for this sub-round / category
 *  tag         – small pill label  e.g. "ROUND 01 · CATEGORY"
 *  title       – main heading      e.g. "Sarvagna"
 *  titleKn     – Kannada subtitle  (optional)
 *  sub         – English sub-label e.g. "General Knowledge"
 *  tagline     – one-liner desc
 *  icon        – emoji or character (optional, decorative)
 *  onContinue  – callback when user taps "Let's Go"
 *  onBack      – callback for ← back arrow
 *  backLabel   – label for back link  (default "← Back")
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { sounds } from '../utils/sounds'

// Ambient floating character positions (percent x/y)
const PARTICLE_POS = [
  {x:7,y:8},{x:29,y:14},{x:55,y:6},{x:75,y:18},{x:90,y:8},
  {x:14,y:38},{x:72,y:36},{x:6,y:59},{x:92,y:55},{x:46,y:5},
  {x:20,y:78},{x:60,y:82},{x:82,y:74},{x:36,y:88},{x:5,y:85},
  {x:48,y:92},{x:86,y:88},{x:12,y:52},{x:83,y:28},{x:42,y:70},
  {x:68,y:60},{x:26,y:30},{x:53,y:48},{x:8,y:22},{x:93,y:38},
]

export default function SubRoundLandingPage({
  accent    = '#FFD700',
  tag       = 'ROUND',
  title     = '',
  titleKn   = '',
  sub       = '',
  tagline   = '',
  icon      = '?',
  onContinue,
  onBack,
  backLabel = '← Back',
}) {
  const seeds  = useRef(PARTICLE_POS.map(() => Math.random())).current

  // ── Animation state ───────────────────────────────────────────
  const [particles,   setParticles]   = useState(() => PARTICLE_POS.map((p,i) => ({...p, id:i, opacity:0})))
  const [showRings,   setShowRings]   = useState(false)
  const [showTag,     setShowTag]     = useState(false)
  const [showTitle,   setShowTitle]   = useState(false)
  const [showLine,    setShowLine]    = useState(false)
  const [showSub,     setShowSub]     = useState(false)
  const [showTagline, setShowTagline] = useState(false)
  const [showCTA,     setShowCTA]     = useState(false)
  const [exiting,     setExiting]     = useState(false)

  const timers = useRef([])
  const T = useCallback((fn, ms) => {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
  }, [])

  useEffect(() => {
    // Stagger particle fade-in
    PARTICLE_POS.forEach((_, i) =>
      T(() => setParticles(prev => prev.map(p =>
        p.id === i ? {...p, opacity: 0.08 + seeds[i] * 0.35} : p
      )), 40 + i * 48)
    )
    T(() => setShowRings(true),   900)
    T(() => setShowTag(true),     1400)
    T(() => { setShowTitle(true); sounds.subWhoosh() }, 1900)
    T(() => setShowLine(true),    2500)
    T(() => setShowSub(true),     2800)
    T(() => setShowTagline(true), 3100)
    T(() => setShowCTA(true),     3700)
    return () => timers.current.forEach(clearTimeout)
  }, [title])

  const handleContinue = () => {
    sounds.click()
    setExiting(true)
    setTimeout(() => onContinue?.(), 550)
  }

  const handleBack = () => {
    sounds.click()
    setExiting(true)
    setTimeout(() => onBack?.(), 400)
  }

  // Derive background tint from accent
  const bgTint = `${accent}0A`

  return (
    <div style={{
      minHeight:'100vh',
      background:`radial-gradient(ellipse at 50% 38%, ${bgTint} 0%, #0A0A0F 68%)`,
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      overflow:'hidden', position:'relative', gap:10,
      opacity: exiting ? 0 : 1,
      transition: exiting ? 'opacity 0.55s ease' : 'none',
    }}>

      {/* ── Ambient dot field ─────────────────────────────────── */}
      {seeds.map((s, i) => (
        <div key={i} style={{
          position:'absolute', borderRadius:'50%', background:accent,
          width:`${0.8+s*1.4}px`, height:`${0.8+s*1.4}px`,
          left:`${(s*97+i*3.7)%100}%`, top:`${(s*97+i*7.3)%100}%`,
          opacity: 0.03 + s * 0.09, pointerEvents:'none',
          animation:`starPulse ${1.4+s*1.6}s ease-in-out infinite alternate`,
          animationDelay:`${s*2}s`,
        }} />
      ))}

      {/* ── Floating icon particles ───────────────────────────── */}
      {particles.map(p => (
        <div key={p.id} style={{
          position:'absolute', pointerEvents:'none',
          fontFamily:'Georgia,serif', fontWeight:700, lineHeight:1, userSelect:'none',
          left:`${p.x}%`, top:`${p.y}%`,
          fontSize:`${11 + seeds[p.id] * 18}px`, color:accent,
          opacity:p.opacity, transition:'opacity 1.1s ease',
          filter:`drop-shadow(0 0 4px ${accent}40)`,
        }}>{icon}</div>
      ))}

      {/* ── Concentric glow rings ─────────────────────────────── */}
      {showRings && [
        {w:380, op:`${accent}22`, d:'0s'},
        {w:270, op:`${accent}16`, d:'0.4s'},
        {w:170, op:`${accent}0C`, d:'0.8s'},
      ].map((r,i) => (
        <div key={i} style={{
          position:'absolute', borderRadius:'50%', width:r.w, height:r.w,
          border:`1px solid ${r.op}`, pointerEvents:'none',
          animation:`ringPop 0.8s ease forwards, ringBreath 3.2s ease-in-out ${r.d} infinite`,
        }} />
      ))}

      {/* ── Corner brackets ───────────────────────────────────── */}
      {['tl','tr','bl','br'].map(p => (
        <div key={p} className={`corner-bracket corner-bracket--${p}`}
          style={{borderColor:`${accent}55`}} />
      ))}

      {/* ── Central content ───────────────────────────────────── */}
      <div style={{
        position:'relative', zIndex:10,
        display:'flex', flexDirection:'column', alignItems:'center', gap:14,
        padding:'0 24px', textAlign:'center',
      }}>

        {/* Back link */}
        <button
          style={{
            position:'absolute', top:-56, left:0,
            background:'none', border:'none', cursor:'pointer',
            fontFamily:'Inter,sans-serif', fontSize:12, letterSpacing:1,
            color:`${accent}55`, padding:0, transition:'color 0.2s',
          }}
          onClick={handleBack}
          onMouseEnter={e => e.currentTarget.style.color=accent}
          onMouseLeave={e => e.currentTarget.style.color=`${accent}55`}
        >{backLabel}</button>

        {/* Tag pill */}
        <div style={{
          fontFamily:'Inter,sans-serif', fontSize:10, fontWeight:700,
          letterSpacing:5, color:accent, textTransform:'uppercase',
          border:`1px solid ${accent}33`, borderRadius:9999, padding:'6px 20px',
          opacity: showTag ? 0.85 : 0,
          transform: showTag ? 'translateY(0)' : 'translateY(-12px)',
          transition:'all 0.7s cubic-bezier(0.34,1.56,0.64,1)',
        }}>{tag}</div>

        {/* Main title */}
        <div style={{
          opacity: showTitle ? 1 : 0,
          transform: showTitle ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.7)',
          transition: showTitle ? 'all 0.85s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
        }}>
          {/* Decorative lines flanking title */}
          <div style={{display:'flex', alignItems:'center', gap:16}}>
            <div style={{
              width: showTitle ? 60 : 0, height:1,
              background:`linear-gradient(90deg,transparent,${accent}55)`,
              transition:'width 0.9s ease 0.3s',
            }} />
            <h1 style={{
              fontFamily:"'Playfair Display',Georgia,serif",
              fontSize: title.length > 14 ? 46 : 58,
              fontWeight:900, color:accent, lineHeight:1.1,
              textShadow:`0 0 60px ${accent}30, 3px 3px 0 ${accent}18`,
              margin:0, letterSpacing:1,
            }}>{title}</h1>
            <div style={{
              width: showTitle ? 60 : 0, height:1,
              background:`linear-gradient(90deg,${accent}55,transparent)`,
              transition:'width 0.9s ease 0.3s',
            }} />
          </div>

          {/* Kannada subtitle */}
          {titleKn && (
            <div style={{
              fontFamily:"'Noto Sans Kannada',sans-serif",
              fontSize:20, color:`${accent}88`,
              marginTop:6, fontWeight:600,
            }}>{titleKn}</div>
          )}
        </div>

        {/* Gold divider line */}
        {showLine && (
          <div style={{
            height:1,
            background:`linear-gradient(90deg,transparent,${accent},transparent)`,
            width:0, animation:'lineExpand 0.9s ease 0.1s forwards',
          }} />
        )}

        {/* Sub-label */}
        <div style={{
          fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700,
          letterSpacing:4, color:`${accent}66`, textTransform:'uppercase',
          opacity: showSub ? 1 : 0,
          transform: showSub ? 'translateY(0)' : 'translateY(10px)',
          transition:'all 0.6s ease',
        }}>{sub}</div>

        {/* Tagline */}
        <div style={{
          fontFamily:'Inter,sans-serif', fontSize:13, letterSpacing:1.5,
          color:`rgba(255,255,255,0.38)`, maxWidth:460, lineHeight:1.85,
          opacity: showTagline ? 1 : 0,
          transform: showTagline ? 'translateY(0)' : 'translateY(12px)',
          transition:'all 0.7s ease',
        }}>{tagline}</div>

        {/* CTA Button */}
        {showCTA && (
          <button
            style={{
              marginTop:32,
              background:`linear-gradient(145deg,rgba(22,22,40,0.96),rgba(14,14,26,0.96))`,
              border:`1.5px solid ${accent}55`, borderRadius:9999,
              padding:'17px 56px', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:5,
              boxShadow:`0 8px 32px ${accent}20, 0 2px 8px rgba(0,0,0,0.5)`,
              animation:'fadeUp 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards', opacity:0,
              transition:'all 0.32s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={handleContinue}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor=accent
              e.currentTarget.style.boxShadow=`0 16px 52px ${accent}45, 0 4px 16px rgba(0,0,0,0.5)`
              e.currentTarget.style.transform='translateY(-4px) scale(1.04)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor=`${accent}55`
              e.currentTarget.style.boxShadow=`0 8px 32px ${accent}20, 0 2px 8px rgba(0,0,0,0.5)`
              e.currentTarget.style.transform='translateY(0) scale(1)'
            }}
          >
            <span style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:15, fontWeight:700, letterSpacing:3, color:accent,
            }}>Let's Go</span>
            <span style={{fontSize:10, letterSpacing:2, color:`${accent}55`}}>tap to begin →</span>
          </button>
        )}
      </div>
    </div>
  )
}
