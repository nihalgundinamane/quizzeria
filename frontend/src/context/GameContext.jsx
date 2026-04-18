import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'

const GameContext = createContext(null)

// ── localStorage helpers ──────────────────────────────────────────
const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && fallback instanceof Set) return new Set(parsed)
    return parsed
  } catch { return fallback }
}
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value instanceof Set ? [...value] : value))
  } catch {}
}

export function GameProvider({ children }) {
  // If no explicit save exists, wipe all in-progress keys on load (covers refresh/Ctrl+C restart)
  const _hasSave = (() => { try { return !!localStorage.getItem('qz-save') } catch { return false } })()
  if (!_hasSave) {
    ;['qz-teams','qz-scores','qz-toss','qz-round','qz-cats','qz-rounds',
      'qz-r02cats','qz-r03cats','qz-progress']
      .forEach(k => { try { localStorage.removeItem(k) } catch {} })
  }

  const [teams, setTeams]           = useState(() => load('qz-teams',   { team1:'', team2:'' }))
  const [scores, setScores]         = useState(() => load('qz-scores',  { team1:0, team2:0 }))
  const [tossWinner, setTossWinner] = useState(() => load('qz-toss',    null))
  const [currentRound, setCurrentRound]       = useState(() => load('qz-round', 1))
  const [currentCategory, setCurrentCategory] = useState(null)
  const [categoryIndex, setCategoryIndex]     = useState(0)
  const [questionIndex, setQuestionIndex]     = useState(0)
  const [completedQuestions, setCompletedQuestions] = useState(new Set())
  const [completedCategories, setCompletedCategories] = useState(() => load('qz-cats',   new Set()))
  const [completedRounds, setCompletedRounds]         = useState(() => load('qz-rounds', new Set()))
  const [completedR02Cats, setCompletedR02Cats]       = useState(() => load('qz-r02cats', new Set()))
  const [completedR03Cats, setCompletedR03Cats]       = useState(() => load('qz-r03cats', new Set()))
  // answerProgress: { 'r01_gk': [0,1,2], 'r04': [0,3,7], ... } — question indices answered
  // Only restore from localStorage if a saved game snapshot exists (user explicitly saved)
  // On plain refresh with no save, always start with clean progress
  const [answerProgress, setAnswerProgress] = useState(() => {
    try {
      const hasSave = !!localStorage.getItem('qz-save')
      if (!hasSave) {
        localStorage.removeItem('qz-progress')
        return {}
      }
      const r = localStorage.getItem('qz-progress')
      return r ? JSON.parse(r) : {}
    } catch { return {} }
  })
  // Always start at landing — user chooses Continue or New Game from there
  const [phase, setPhase] = useState('landing')
  // ── Streak tracking ───────────────────────────────────────────
  const [streaks, setStreaks]         = useState({ team1: 0, team2: 0 })
  const [onFire,  setOnFire]          = useState({ team1: false, team2: false })
  const [peakStreaks, setPeakStreaks]  = useState({ team1: 0, team2: 0 })

  // ── Persist on every change ───────────────────────────────────
  useEffect(() => { save('qz-teams',   teams)               }, [teams])
  useEffect(() => { save('qz-scores',  scores)              }, [scores])
  useEffect(() => { save('qz-toss',    tossWinner)          }, [tossWinner])
  useEffect(() => { save('qz-round',   currentRound)        }, [currentRound])
  useEffect(() => { save('qz-cats',    completedCategories) }, [completedCategories])
  useEffect(() => { save('qz-rounds',  completedRounds)     }, [completedRounds])
  useEffect(() => { save('qz-r02cats', completedR02Cats)   }, [completedR02Cats])
  useEffect(() => { save('qz-r03cats', completedR03Cats)   }, [completedR03Cats])
  useEffect(() => {
    if (Object.keys(answerProgress).length === 0) return
    try { localStorage.setItem('qz-progress', JSON.stringify(answerProgress)) } catch {}
  }, [answerProgress])

  const categoryStartTeam = useCallback((catIdx) => {
    const base = tossWinner || 1
    return (catIdx % 2 === 0) ? base : (base === 1 ? 2 : 1)
  }, [tossWinner])

  const teamForQuestion = useCallback((qIdx, catIdx) => {
    const starter = categoryStartTeam(catIdx)
    return (qIdx % 2 === 0) ? starter : (starter === 1 ? 2 : 1)
  }, [categoryStartTeam])

  const addScore = useCallback((team, pts) => {
    setScores(prev => ({
      ...prev,
      [`team${team}`]: prev[`team${team}`] + pts
    }))
  }, [])

  // ── Streak helpers ────────────────────────────────────────────
  const recordCorrect = useCallback((team) => {
    setStreaks(prev => {
      const key = `team${team}`
      const other = team === 1 ? 'team2' : 'team1'
      const newVal = prev[key] + 1
      if (newVal >= 3) {
        setOnFire(f => ({ ...f, [key]: true }))
        setTimeout(() => setOnFire(f => ({ ...f, [key]: false })), 3500)
      }
      setPeakStreaks(pk => ({ ...pk, [key]: Math.max(pk[key], newVal) }))
      return { ...prev, [key]: newVal, [other]: 0 }
    })
  }, [])

  const recordWrong = useCallback((team) => {
    setStreaks(prev => ({ ...prev, [`team${team}`]: 0 }))
  }, [])

  const markQuestionDone = useCallback((idx) => {
    setCompletedQuestions(prev => new Set([...prev, idx]))
  }, [])

  const nextQuestion = useCallback(() => {
    setCompletedQuestions(prev => new Set([...prev, questionIndex]))
    setQuestionIndex(i => i + 1)
  }, [questionIndex])

  const startNewCategory = useCallback((cat, catIdx) => {
    setCurrentCategory(cat)
    setCategoryIndex(catIdx)
    setQuestionIndex(0)
    setCompletedQuestions(new Set())
    setPhase('questionPlay')
  }, [])

  const cancelCategory = useCallback(() => {
    setCurrentCategory(null)
    setQuestionIndex(0)
    setCompletedQuestions(new Set())
    setPhase('categorySelect')
  }, [])

  const finishCategory = useCallback((catId) => {
    const id = catId || currentCategory?.id
    if (id) setCompletedCategories(prev => new Set([...prev, id]))
    setCurrentCategory(null)
    setQuestionIndex(0)
    setCompletedQuestions(new Set())
    setCategoryIndex(i => i + 1)
    setPhase('categorySelect')
  }, [currentCategory])

  const markRoundDone = useCallback((roundNum) => {
    setCompletedRounds(prev => new Set([...prev, roundNum]))
  }, [])

  const resetGame = useCallback(() => {
    ['qz-teams','qz-scores','qz-toss','qz-round','qz-cats','qz-rounds',
     'qz-r02cats','qz-r03cats','qz-save','qz-progress']
      .forEach(k => { try { localStorage.removeItem(k) } catch {} })
    setTeams({ team1:'', team2:'' })
    setScores({ team1:0, team2:0 })
    setTossWinner(null)
    setCurrentRound(1)
    setCurrentCategory(null)
    setCategoryIndex(0)
    setQuestionIndex(0)
    setCompletedQuestions(new Set())
    setCompletedCategories(new Set())
    setCompletedRounds(new Set())
    setCompletedR02Cats(new Set())
    setCompletedR03Cats(new Set())
    setAnswerProgress({})
    setPhase('landing')
  }, [])

  // ── Question-level progress ──────────────────────────────────
  const markAnswered = useCallback((key, idx) => {
    setAnswerProgress(prev => {
      const existing = prev[key] || []
      if (existing.includes(idx)) return prev
      return { ...prev, [key]: [...existing, idx] }
    })
  }, [])

  const getAnswered = useCallback((key) => {
    return new Set(answerProgress[key] || [])
  }, [answerProgress])

  // ── Explicit save: user taps "Save Game" ─────────────────────
  const saveGame = useCallback((teams_, scores_, toss, round, cats, rounds, r02cats, r03cats) => {
    // Read latest progress from localStorage directly (always up-to-date)
    let progress = {}
    try { const r = localStorage.getItem('qz-progress'); progress = r ? JSON.parse(r) : {} } catch {}
    const snapshot = {
      savedAt:   new Date().toISOString(),
      teams:     teams_,
      scores:    scores_,
      toss:      toss,
      round:     round,
      cats:      [...cats],
      rounds:    [...rounds],
      r02cats:   [...r02cats],
      r03cats:   [...r03cats],
      progress:  progress,
    }
    try { localStorage.setItem('qz-save', JSON.stringify(snapshot)) } catch {}
  }, [])

  const hasSavedGame = useMemo(() => {
    try { return !!localStorage.getItem('qz-save') } catch { return false }
  }, [])

  const loadSavedGame = useCallback(() => {
    try {
      const raw = localStorage.getItem('qz-save')
      if (!raw) return false
      const s = JSON.parse(raw)
      setTeams(s.teams)
      setScores(s.scores)
      setTossWinner(s.toss)
      setCurrentRound(s.round)
      setCompletedCategories(new Set(s.cats || []))
      setCompletedRounds(new Set(s.rounds || []))
      setCompletedR02Cats(new Set(s.r02cats || []))
      setCompletedR03Cats(new Set(s.r03cats || []))
      // Restore question-level progress
      if (s.progress) {
        try { localStorage.setItem('qz-progress', JSON.stringify(s.progress)) } catch {}
        setAnswerProgress(s.progress)
      }
      setPhase('roundSelect')
      return true
    } catch { return false }
  }, [])

  return (
    <GameContext.Provider value={{
      teams, setTeams,
      scores, addScore,
      streaks, onFire, peakStreaks, recordCorrect, recordWrong,
      tossWinner, setTossWinner,
      currentRound, setCurrentRound,
      currentCategory,
      categoryIndex, setCategoryIndex,
      questionIndex, setQuestionIndex, nextQuestion, markQuestionDone,
      completedQuestions, completedCategories, completedRounds,
      completedR02Cats, setCompletedR02Cats,
      completedR03Cats, setCompletedR03Cats,
      teamForQuestion, categoryStartTeam,
      startNewCategory,
      cancelCategory,
      finishCategory,
      markRoundDone,
      resetGame,
      saveGame, hasSavedGame, loadSavedGame,
      answerProgress, markAnswered, getAnswered,
      phase, setPhase,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame() must be used inside <GameProvider>')
  return ctx
}
