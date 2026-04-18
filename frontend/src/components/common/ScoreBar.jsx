import { useRef, useEffect, useState } from 'react'
import { useGame } from '../../context/GameContext'

/* ── Mini confetti burst for score milestones ─────────────── */
function MilestoneConfetti({ active, color }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = 280; canvas.height = 80
    const particles = Array.from({ length: 30 }, () => ({
      x: 140 + (Math.random() - 0.5) * 60, y: 40,
      vx: (Math.random() - 0.5) * 6, vy: -3 - Math.random() * 4,
      size: 3 + Math.random() * 4,
      color: [color, '#FFD700', '#FFF', '#FFA500'][Math.floor(Math.random() * 4)],
      opacity: 1, gravity: 0.18,
    }))
    let anim
    const draw = () => {
      ctx.clearRect(0, 0, 280, 80)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.opacity -= 0.025
        ctx.save(); ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
        ctx.restore()
      })
      if (particles.some(p => p.opacity > 0)) anim = requestAnimationFrame(draw)
    }
    anim = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(anim)
  }, [active, color])
  if (!active) return null
  return <canvas ref={canvasRef} style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', pointerEvents:'none', zIndex:10 }} />
}

export default function ScoreBar() {
  const { teams, scores, onFire } = useGame()
  const t1Ref = useRef(null)
  const t2Ref = useRef(null)
  const prev  = useRef({ t1: 0, t2: 0 })
  const [milestone1, setMilestone1] = useState(false)
  const [milestone2, setMilestone2] = useState(false)
  const prevMilestone = useRef({ t1: 0, t2: 0 })

  useEffect(() => {
    if (scores.team1 !== prev.current.t1 && t1Ref.current) {
      t1Ref.current.classList.remove('bump')
      void t1Ref.current.offsetWidth
      t1Ref.current.classList.add('bump')
      prev.current.t1 = scores.team1
    }
    // Milestone check: 100, 200, 300 …
    const m1 = Math.floor(scores.team1 / 100)
    if (m1 > prevMilestone.current.t1 && scores.team1 > 0) {
      prevMilestone.current.t1 = m1
      setMilestone1(true)
      setTimeout(() => setMilestone1(false), 1800)
    }
  }, [scores.team1])

  useEffect(() => {
    if (scores.team2 !== prev.current.t2 && t2Ref.current) {
      t2Ref.current.classList.remove('bump')
      void t2Ref.current.offsetWidth
      t2Ref.current.classList.add('bump')
      prev.current.t2 = scores.team2
    }
    const m2 = Math.floor(scores.team2 / 100)
    if (m2 > prevMilestone.current.t2 && scores.team2 > 0) {
      prevMilestone.current.t2 = m2
      setMilestone2(true)
      setTimeout(() => setMilestone2(false), 1800)
    }
  }, [scores.team2])

  return (
    <div className="score-bar" style={{ position:'relative', overflow:'visible' }}>
      {/* Milestone confetti overlays */}
      <MilestoneConfetti active={milestone1} color="#FFD700" />
      <MilestoneConfetti active={milestone2} color="#FFA500" />

      {/* 🔥 On Fire banners */}
      {onFire?.team1 && (
        <div style={S.fireBanner('#FFD700', 'left')}>🔥 On Fire!</div>
      )}
      {onFire?.team2 && (
        <div style={S.fireBanner('#FFA500', 'right')}>🔥 On Fire!</div>
      )}

      {/* Team 1 */}
      <div className="score-bar__team" style={{ justifyContent:'flex-start', position:'relative' }}>
        <div style={S.dot('#FFD700')} />
        <span className="score-bar__name" style={{ color:'#FFD700' }}>{teams.team1||'Team 1'}</span>
        <span className="score-bar__pts" ref={t1Ref} style={{ color: milestone1 ? '#FFF' : '#FFD700', transition:'color 0.3s' }}>{scores.team1}</span>
        {milestone1 && <span style={S.milestoneTag('#FFD700')}>🎉 {scores.team1}!</span>}
      </div>

      {/* Centre logo */}
      <span className="score-bar__logo">QUIZZERIA</span>

      {/* Team 2 */}
      <div className="score-bar__team" style={{ justifyContent:'flex-end', position:'relative' }}>
        {milestone2 && <span style={S.milestoneTag('#FFA500')}>🎉 {scores.team2}!</span>}
        <span className="score-bar__pts" ref={t2Ref} style={{ color: milestone2 ? '#FFF' : '#FFA500', transition:'color 0.3s' }}>{scores.team2}</span>
        <span className="score-bar__name" style={{ color:'#FFA500', textAlign:'right' }}>{teams.team2||'Team 2'}</span>
        <div style={S.dot('#FFA500')} />
      </div>
    </div>
  )
}

const S = {
  dot: (color) => ({
    width: 7, height: 7, borderRadius: '50%',
    background: color, opacity: 0.7, flexShrink: 0,
  }),
  fireBanner: (color, side) => ({
    position: 'absolute',
    [side]: 0,
    top: '100%',
    marginTop: 4,
    background: `linear-gradient(90deg, ${color}22, ${color}11)`,
    border: `1px solid ${color}55`,
    borderRadius: 9999,
    padding: '4px 14px',
    fontSize: 11,
    fontWeight: 800,
    color,
    fontFamily: 'Inter, sans-serif',
    letterSpacing: 1,
    whiteSpace: 'nowrap',
    zIndex: 50,
    animation: 'fireBanner 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
    boxShadow: `0 0 12px ${color}33`,
  }),
  milestoneTag: (color) => ({
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: `linear-gradient(135deg, ${color}33, ${color}11)`,
    border: `1px solid ${color}66`,
    borderRadius: 9999,
    padding: '2px 10px',
    fontSize: 10,
    fontWeight: 800,
    color,
    fontFamily: 'Inter, sans-serif',
    whiteSpace: 'nowrap',
    zIndex: 50,
    animation: 'milestoneTag 1.8s ease forwards',
  }),
}
