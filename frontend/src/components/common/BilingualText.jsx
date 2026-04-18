// Shows English text with Kannada below it in a softer style
export function BilingualQuestion({ en, kn, style = {} }) {
  return (
    <div style={style}>
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 22, fontWeight: 700, color: '#F5F5F5', lineHeight: 1.65,
      }}>
        {en}
      </div>
      {kn && (
        <div style={{
          fontFamily: "'Noto Sans Kannada', 'Noto Serif Kannada', sans-serif",
          fontSize: 15, color: 'rgba(255,215,0,0.45)', lineHeight: 1.7,
          marginTop: 8, paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          letterSpacing: 0.3,
        }}>
          {kn}
        </div>
      )}
    </div>
  )
}

export function BilingualOption({ en, kn, letter, selected, result, canPick, teamColor, onSelect }) {
  let bg = 'rgba(255,255,255,0.04)'
  let border = 'rgba(255,255,255,0.09)'

  if (result === 'correct') { bg='rgba(34,197,94,0.12)'; border='rgba(34,197,94,0.6)' }
  else if (result === 'wrong') { bg='rgba(239,68,68,0.12)'; border='rgba(239,68,68,0.6)' }
  else if (selected && !result) { bg=`${teamColor}0D`; border=`${teamColor}BB` }

  return (
    <button
      style={{
        background: bg, border: `1px solid ${border}`,
        borderRadius: 14, padding: '14px 18px',
        display: 'flex', flexDirection: 'column', gap: 4,
        textAlign: 'left', cursor: canPick ? 'pointer' : 'default',
        transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: result==='correct' ? '0 0 24px rgba(34,197,94,0.18)' : result==='wrong' ? '0 0 24px rgba(239,68,68,0.15)' : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        animation: result==='correct' ? 'correctPulse 0.7s ease forwards' : result==='wrong' ? 'wrongShake 0.5s ease forwards' : 'optionSlideIn 0.32s ease forwards',
        opacity: 0, animationFillMode: 'forwards',
        backdropFilter: 'blur(16px)',
        position: 'relative',
      }}
      onClick={canPick ? onSelect : undefined}
      onMouseEnter={e => { if (!canPick) return; e.currentTarget.style.borderColor = `${teamColor}BB`; e.currentTarget.style.transform='translateX(4px)' }}
      onMouseLeave={e => { if (!canPick) return; e.currentTarget.style.borderColor = border; e.currentTarget.style.transform='translateX(0)' }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:900, opacity:0.35, flexShrink:0, width:20 }}>{letter}</span>
        <span style={{ fontSize:15, color:'#E8E8E8', lineHeight:1.4, flex:1 }}>{en}</span>
        {result === 'correct' && <span style={{ fontSize:16, color:'#22C55E', animation:'scorePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>✓</span>}
        {result === 'wrong'   && <span style={{ fontSize:16, color:'#EF4444' }}>✕</span>}
      </div>
      {kn && (
        <div style={{
          fontSize: 12, color: 'rgba(255,215,0,0.35)', lineHeight: 1.5,
          paddingLeft: 32, letterSpacing: 0.2,
          fontFamily: "'Noto Sans Kannada', sans-serif",
        }}>
          {kn}
        </div>
      )}
    </button>
  )
}

export function BilingualHint({ en, kn }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', gap: 6,
      background:'rgba(239,159,39,0.08)', border:'1px solid rgba(239,159,39,0.28)',
      borderRadius:14, padding:'16px 20px',
      animation:'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
      backdropFilter:'blur(10px)',
    }}>
      <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
        <span style={{fontSize:16, flexShrink:0}}>💡</span>
        <span style={{ fontSize:14, color:'rgba(239,159,39,0.9)', lineHeight:1.65, fontFamily:'Inter,sans-serif' }}>
          {en}
        </span>
      </div>
      {kn && (
        <div style={{
          fontSize:13, color:'rgba(239,159,39,0.5)', lineHeight:1.65,
          paddingLeft:26, fontFamily:"'Noto Sans Kannada', sans-serif", letterSpacing:0.2,
        }}>
          {kn}
        </div>
      )}
    </div>
  )
}
