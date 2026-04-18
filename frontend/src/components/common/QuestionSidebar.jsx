export default function QuestionSidebar({ total, currentIndex, completedSet, roundLabel, onJump }) {
  return (
    <div className="q-sidebar">
      <div className="q-sidebar__label">{roundLabel}</div>
      <div className="q-sidebar__grid">
        {Array.from({ length: total }, (_, i) => {
          const done   = completedSet.has(i)
          const active = i === currentIndex
          return (
            <div
              key={i}
              className={`q-sidebar__dot${done ? ' done' : active ? ' active' : ''}`}
              onClick={() => onJump && onJump(i)}
              title={`Question ${i + 1}${done ? ' ✓' : ''}`}
            >
              {done ? '✓' : i + 1}
            </div>
          )
        })}
      </div>
    </div>
  )
}
