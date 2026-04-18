import { useState } from 'react'
import { useGame } from '../../context/GameContext'

export default function SaveButton({ style = {} }) {
  const {
    teams, scores, tossWinner, currentRound,
    completedCategories, completedRounds,
    completedR02Cats, completedR03Cats,
    saveGame
  } = useGame()

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    saveGame(
      teams, scores, tossWinner, currentRound,
      completedCategories, completedRounds,
      completedR02Cats, completedR03Cats
    )
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <button
      onClick={handleSave}
      style={{
        background: saved ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${saved ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 12,
        padding: '10px 22px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.3s ease',
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        letterSpacing: 1,
        color: saved ? '#22C55E' : 'rgba(255,255,255,0.35)',
        ...style,
      }}
    >
      <span style={{ fontSize: 14 }}>{saved ? '✓' : '💾'}</span>
      <span>{saved ? 'Game Saved!' : 'Save Game'}</span>
    </button>
  )
}
