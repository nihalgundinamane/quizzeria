import { useEffect, useRef, useState, useCallback } from 'react'
import { useGame } from '../context/GameContext'
import { sounds } from '../utils/sounds'

/* ── Particle explosion on round name reveal ─────────────────── */
function useParticles(accent, trigger) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!trigger) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const cx = canvas.width / 2, cy = canvas.height * 0.42

    const particles = Array.from({ length: 80 }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 9
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 2 + Math.random() * 5,
        color: [accent, '#FFD700', '#FFF', '#FFA500', accent + 'aa'][Math.floor(Math.random() * 5)],
        opacity: 1,
        gravity: 0.12 + Math.random() * 0.08,
        shape: Math.random() > 0.5 ? 'circle' : 'square',
      }
    })

    let anim
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity
        p.vx *= 0.98; p.opacity -= 0.016
        if (p.opacity <= 0) return
        alive = true
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.fillStyle = p.color
        if (p.shape === 'circle') {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); ctx.fill()
        } else {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
        }
        ctx.restore()
      })
      if (alive) anim = requestAnimationFrame(draw)
    }
    anim = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(anim)
  }, [trigger, accent])
  return canvasRef
}

const ROUND_CFG = {
  1: { accent:'#FFD700', accentDim:'#FFA500', bg:'#1a1500', nextPhase:'rules', animKey:'r1' },
  2: { accent:'#85B7EB', accentDim:'#378ADD', bg:'#00101a', nextPhase:'rules', animKey:'r2' },
  3: { accent:'#C084FC', accentDim:'#A855F7', bg:'#0f0a1a', nextPhase:'rules', animKey:'r3' },
  4: { accent:'#F87171', accentDim:'#EF4444', bg:'#1a0505', nextPhase:'rules', animKey:'r4' },
  5: { accent:'#FB923C', accentDim:'#F97316', bg:'#1a0800', nextPhase:'rules',   animKey:'r5' },
  6: { accent:'#34D399', accentDim:'#10B981', bg:'#001a0e', nextPhase:'rules',   animKey:'r6' },
  7: { accent:'#38BDF8', accentDim:'#0EA5E9', bg:'#00101a', nextPhase:'rules', animKey:'r7' },
  8: { accent:'#F59E0B', accentDim:'#D97706', bg:'#1a1000', nextPhase:'rules',   animKey:'r8' },
}

const ROUND_NAMES = {
  1:'Category Clash', 2:'The Visual Vault', 3:'The Wild Card',
  4:'Buzzer Battle',  5:'Agni Pariksha',    6:'Pen & Power',
  7:'Decode Zone',    8:'The Final Frontier',
}
const ROUND_TAGS = { 1:'ROUND 01', 2:'ROUND 02', 3:'ROUND 03', 4:'ROUND 04', 5:'ROUND 05', 6:'ROUND 06', 7:'ROUND 07', 8:'ROUND 08' }
const ROUND_TAGLINES = {
  1:'Ten Categories. Thirty Questions Each. One Winner.',
  2:'Identify the Image. Beat the Clock.',
  3:'Smart. Funny. Confusing. Expect the unexpected.',
  4:'Fifty Questions. First to Buzz Wins.',
  5:'Twenty Questions. Ten Minutes. No Mercy.',
  6:'Paper. Pen. Ten minutes. Write your destiny.',
  7:'Remember the sequence. Crack the emoji.',
  8:'One question. Four minutes. Everything on the line.',
}

// 8 different animation styles for the name reveal
function getNameStyle(animKey, visible, a) {
  const base = {
    fontFamily:"'Playfair Display',Georgia,serif",
    fontWeight: 900,
    color: a,
    textShadow: `0 0 60px ${a}30`,
    lineHeight: 1.1,
    textAlign: 'center',
    display: 'block',
  }

  if (!visible) return { ...base, opacity: 0, pointerEvents:'none' }

  const styles = {
    r1: { ...base, fontSize:58, animation:'r1BounceUp 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards' },
    r2: { ...base, fontSize:58, animation:'r2ZoomBlur 0.9s ease forwards' },
    r3: { ...base, fontSize:56, animation:'r3SlideLeft 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards' },
    r4: { ...base, fontSize:58, animation:'r4Slam 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards' },
    r5: { ...base, fontSize:58, animation:'r5Stretch 0.85s cubic-bezier(0.34,1.56,0.64,1) forwards' },
    r6: { ...base, fontSize:56, letterSpacing:2, animation:'r6Elegant 1.1s ease forwards' },
    r7: { ...base, fontSize:56, animation:'r7Spin 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards' },
    r8: { ...base, fontSize:50 }, // handled specially with split halves
  }
  return styles[animKey] || styles.r1
}

export default function RoundIntroPage() {
  const { currentRound, setPhase } = useGame()
  const cfg     = ROUND_CFG[currentRound]  || ROUND_CFG[1]
  const name    = ROUND_NAMES[currentRound] || 'Round'
  const tag     = ROUND_TAGS[currentRound]  || 'ROUND'
  const tagline = ROUND_TAGLINES[currentRound] || ''

  const [showTag,    setShowTag]    = useState(false)
  const [showName,   setShowName]   = useState(false)
  const [showLine,   setShowLine]   = useState(false)
  const [showTagline,setShowTagline]= useState(false)
  const [showCTA,    setShowCTA]    = useState(false)
  const [exiting,    setExiting]    = useState(false)
  const timers = useRef([])
  const T = useCallback((fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t) }, [])

  const a  = cfg.accent
  const ad = cfg.accentDim

  const particleRef = useParticles(a, showName)

  useEffect(() => {
    T(() => setShowTag(true),     350)
    T(() => { setShowName(true); sounds.whoosh() },    900)
    T(() => setShowLine(true),   1600)
    T(() => setShowTagline(true),2100)
    T(() => setShowCTA(true),    3000)
    return () => timers.current.forEach(clearTimeout)
  }, [currentRound])

  const handleContinue = () => {
    setExiting(true)
    setTimeout(() => setPhase(cfg.nextPhase), 600)
  }

  const nameStyle = getNameStyle(cfg.animKey, showName, a)

  // Round 8: split the name into two halves for the split animation
  const isR8 = cfg.animKey === 'r8'
  const half = Math.ceil(name.length / 2)
  const nameA = name.slice(0, half)
  const nameB = name.slice(half)

  return (
    <div style={{
      minHeight:'100vh',
      background:`radial-gradient(ellipse at 50% 40%, ${cfg.bg} 0%, #0A0A0F 70%)`,
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      overflow:'hidden', position:'relative', gap: 14,
      opacity: exiting ? 0 : 1,
      transition: exiting ? 'opacity 0.6s ease' : 'none',
    }}>

      {/* Particle explosion canvas */}
      <canvas ref={particleRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:5 }} />

      {/* Corner brackets */}
      {['tl','tr','bl','br'].map(p => (
        <div key={p} className={`corner-bracket corner-bracket--${p}`}
          style={{ borderColor: a }} />
      ))}

      {/* Ambient glow blob — pulses on name reveal */}
      <div style={{
        position:'absolute', width: showName ? 600 : 400, height: showName ? 600 : 400,
        borderRadius:'50%',
        background:`radial-gradient(circle, ${a}${showName ? '10' : '06'} 0%, transparent 70%)`,
        pointerEvents:'none',
        transition: 'all 1.2s ease',
      }} />

      {/* Second ring for drama */}
      {showName && (
        <div style={{
          position:'absolute', width:800, height:800, borderRadius:'50%',
          border:`1px solid ${a}15`,
          pointerEvents:'none',
          animation: 'ringBreath 3s ease-in-out infinite',
        }} />
      )}

      {/* Tag pill */}
      <div style={{
        fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600,
        letterSpacing:6, color:ad, textTransform:'uppercase',
        border:`1px solid ${a}33`, borderRadius:9999, padding:'6px 20px',
        opacity: showTag ? 0.85 : 0,
        transform: showTag ? 'translateY(0)' : 'translateY(-14px)',
        transition:'all 0.7s cubic-bezier(0.34,1.56,0.64,1)',
      }}>{tag}</div>

      {/* Round name — 8 different animation styles */}
      {isR8 ? (
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          <span style={{ ...nameStyle, display:'inline', animation: showName ? 'r8Left 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none', opacity: showName ? 1 : 0 }}>{nameA}</span>
          <span style={{ ...nameStyle, display:'inline', animation: showName ? 'r8Right 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.15s forwards' : 'none', opacity: showName ? 1 : 0 }}>{nameB}</span>
        </div>
      ) : (
        <div style={nameStyle}>{name}</div>
      )}

      {/* Divider */}
      {showLine && (
        <div style={{
          height:1, background:`linear-gradient(90deg,transparent,${a},transparent)`,
          width:0, animation:'lineExpand 0.9s ease 0.1s forwards',
        }} />
      )}

      {/* Tagline */}
      <div style={{
        fontFamily:'Inter,sans-serif', fontSize:13, letterSpacing:2.5,
        color:`${a}77`, textAlign:'center', maxWidth:460, lineHeight:1.8,
        opacity: showTagline ? 1 : 0,
        transform: showTagline ? 'translateY(0)' : 'translateY(14px)',
        transition:'all 0.7s ease',
      }}>{tagline}</div>

      {/* CTA */}
      {showCTA && (
        <button
          style={{
            marginTop:32,
            background:'linear-gradient(145deg,rgba(28,28,50,0.95),rgba(16,16,28,0.95))',
            border:`1.5px solid ${a}55`, borderRadius:9999,
            padding:'17px 52px', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            boxShadow:`0 8px 32px ${a}20, 0 2px 8px rgba(0,0,0,0.5)`,
            animation:'fadeUp 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards', opacity:0,
            transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          }}
          onClick={handleContinue}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = a
            e.currentTarget.style.boxShadow = `0 14px 48px ${a}40, 0 4px 16px rgba(0,0,0,0.5)`
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = `${a}55`
            e.currentTarget.style.boxShadow = `0 8px 32px ${a}20, 0 2px 8px rgba(0,0,0,0.5)`
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
          }}
        >
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, letterSpacing:3, color:a }}>
            Let's Go
          </span>
          <span style={{ fontSize:10, letterSpacing:2, color:`${a}55` }}>tap to continue →</span>
        </button>
      )}
    </div>
  )
}
