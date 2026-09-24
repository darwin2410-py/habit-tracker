import { useState } from 'react'
import { getTodayKey, MONTHS, DAY_HEADERS, getDaysInMonth, getFirstDay, calcBestStreak, isScheduled } from '../utils'
import Chip from './Chip'

export default function MonthlyView({ habits, completions, onToggle, onBack }) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedHabit, setSelectedHabit] = useState(habits[0]?.id || null)
  const today = getTodayKey()
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDay(viewYear, viewMonth)
  const isNextDisabled = viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth())

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const dayKey = d => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selHabit = habits.find(h => h.id === selectedHabit)
  const dueKeys = cells.filter(Boolean).map(dayKey)
    .filter(key => key <= today && isScheduled(selHabit || {}, key))
  const completedDays = dueKeys.filter(key => completions[selectedHabit]?.[key]).length
  const totalDays = dueKeys.length

  const rate = totalDays > 0 ? Math.round(completedDays / totalDays * 100) : 0
  const bestStreak = calcBestStreak(selectedHabit, completions, selHabit)

  return (
    <div className="page">
      <div className="container">
        <div className="monthly-header fade-up">
          <button className="btn-outline soft" onClick={onBack}>Back</button>
          <h1 className="serif">Monthly</h1>
        </div>

        {habits.length === 0 ? (
          <div className="empty fade-up">No habits to show yet.</div>
        ) : (
          <>
            <div className="chip-row habit-tabs fade-up" style={{ animationDelay: '0.1s' }}>
              {habits.map(h => (
                <Chip key={h.id} active={selectedHabit === h.id} onClick={() => setSelectedHabit(h.id)}>{h.name}</Chip>
              ))}
            </div>

            {selectedHabit && (
              <div className="card calendar fade-up" style={{ animationDelay: '0.15s' }}>
                <div className="month-nav">
                  <button className="month-btn" onClick={prevMonth}>&lsaquo;</button>
                  <span className="serif">{MONTHS[viewMonth]} {viewYear}</span>
                  <button className="month-btn" onClick={nextMonth} disabled={isNextDisabled}>&rsaquo;</button>
                </div>

                <div className="stats">
                  {[
                    ['sage', completedDays, 'Done'],
                    ['amber', rate + '%', 'Rate'],
                    ['accent', totalDays - completedDays, 'Missed'],
                    ['sage', bestStreak, 'Best']
                  ].map(([tone, val, label]) => (
                    <div key={label} className={`stat ${tone}`}>
                      <div className="stat-value serif">{val}</div>
                      <div className="stat-label">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="cal-grid">
                  {DAY_HEADERS.map(d => <div key={d} className="cal-head">{d}</div>)}
                  {cells.map((d, i) => {
                    if (!d) return <div key={`e-${i}`} />
                    const key = dayKey(d)
                    const done = completions[selectedHabit]?.[key]
                    const scheduled = selHabit ? isScheduled(selHabit, key) : true
                    const cls = ['cal-day']
                    if (done) cls.push('done')
                    if (key === today) cls.push('today')
                    if (!scheduled) cls.push('off')
                    return (
                      <button key={key} className={cls.join(' ')}
                        disabled={key > today || !scheduled}
                        onClick={() => onToggle(selectedHabit, key)}>{d}</button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
