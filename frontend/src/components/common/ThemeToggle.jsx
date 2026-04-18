import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('quizzeria-theme') !== 'light' } catch { return true }
  })

  useEffect(() => {
    const theme = dark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
    try { localStorage.setItem('quizzeria-theme', theme) } catch {}
  }, [dark])

  return (
    <button
      onClick={() => setDark(d => !d)}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        position:'fixed', bottom:20, right:20, zIndex:999,
        width:44, height:44, borderRadius:'50%',
        background: dark ? 'rgba(18,18,34,0.95)' : 'rgba(255,252,244,0.95)',
        border: dark ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(139,105,20,0.3)',
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:19,
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        boxShadow: dark
          ? '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,215,0,0.06)'
          : '0 4px 24px rgba(28,26,20,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
        transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}
      onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.14)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';}}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
