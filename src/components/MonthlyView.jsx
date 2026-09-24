import { useState } from 'react'
import { getTodayKey, MONTHS, DAY_HEADERS, getDaysInMonth, getFirstDay, calcBestStreak, isScheduled, getStartKey } from '../utils'
import Chip from './Chip'

const ALL = 'all'

export default function MonthlyView({ habits, completions, onToggle, onBack }) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedHabit, setSelectedHabit] = useState(ALL)
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

  const isAll = selectedHabit === ALL
  const monthKeys = cells.filter(Boolean).map(dayKey)
  const starts = Object.fromEntries(habits.map(h => [h.id, getStartKey(h, completions[h.id])]))
  const isDue = (h, key) => key <= today && isScheduled(h, key) && (!starts[h.id] || key >= starts[h.id])

  // Per day: how many habits were due and how many of those were done
  const daySummary = Object.fromEntries(monthKeys.map(key => {
    const due = habits.filter(h => isDue(h, key))
    return [key, { due: due.length, done: due.filter(h => completions[h.id]?.[key]).length }]
  }))

  const selHabit = habits.find(h => h.id === selectedHabit)
  let stats
  if (isAll) {
    const days = Object.values(daySummary)
    const due = days.reduce((n, d) => n + d.due, 0)
    const done = days.reduce((n, d) => n + d.done, 0)
    stats = [
      ['sage', done, 'Done'],
      ['amber', (due ? Math.round(done / due * 100) : 0) + '%', 'Rate'],
      ['accent', due - done, 'Missed'],
      ['sage', days.filter(d => d.due && d.done === d.due).length, 'Perfect'],
    ]
  } else {
    const dueKeys = monthKeys.filter(key => isDue(selHabit, key))
    const done = dueKeys.filter(key => completions[selectedHabit]?.[key]).length
    stats = [
      ['sage', done, 'Done'],
      ['amber', (dueKeys.length ? Math.round(done / dueKeys.length * 100) : 0) + '%', 'Rate'],
      ['accent', dueKeys.length - done, 'Missed'],
      ['sage', calcBestStreak(selectedHabit, completions, selHabit), 'Best'],
    ]
  }

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
              <Chip active={isAll} onClick={() => setSelectedHabit(ALL)}>All habits</Chip>
              {habits.map(h => (
                <Chip key={h.id} active={selectedHabit === h.id} onClick={() => setSelectedHabit(h.id)}>{h.name}</Chip>
              ))}
            </div>

            {selectedHabit && (
              <div className="card calendar fade-up" style={{ animationDelay: '0.15s' }}>
                <div className="month-nav">
                  <button className="month-btn" onClick={prevMonth} aria-label="Previous month">&lsaquo;</button>
                  <span className="serif">{MONTHS[viewMonth]} {viewYear}</span>
                  <button className="month-btn" onClick={nextMonth} disabled={isNextDisabled} aria-label="Next month">&rsaquo;</button>
                </div>

                <div className="stats">
                  {stats.map(([tone, val, label]) => (
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
                    const label = new Date(viewYear, viewMonth, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    if (isAll) {
                      const { due, done } = daySummary[key]
                      const ratio = due ? done / due : 0
                      const cls = ['cal-day', 'heat']
                      if (!due) cls.push('none')
                      if (ratio >= 0.6) cls.push('strong')
                      if (key === today) cls.push('today')
                      const text = due ? `${label}: ${done} of ${due} done` : `${label}: nothing due`
                      return (
                        <div key={key} className={cls.join(' ')} style={{ '--heat': `${Math.round(ratio * 100)}%` }}
                          title={text} aria-label={text} role="img">{d}</div>
                      )
                    }
                    const done = completions[selectedHabit]?.[key]
                    const scheduled = selHabit ? isScheduled(selHabit, key) : true
                    const cls = ['cal-day']
                    if (done) cls.push('done')
                    if (key === today) cls.push('today')
                    if (!scheduled) cls.push('off')
                    else if (starts[selectedHabit] && key < starts[selectedHabit]) cls.push('before')
                    return (
                      <button key={key} className={cls.join(' ')}
                        disabled={key > today || !scheduled}
                        aria-label={`${selHabit?.name}, ${label}`} aria-pressed={!!done}
                        onClick={() => onToggle(selectedHabit, key)}>{d}</button>
                    )
                  })}
                </div>
                {isAll && (
                  <div className="legend" aria-hidden="true">
                    Less
                    {[0, 25, 50, 75, 100].map(p => (
                      <span key={p} style={{ background: `color-mix(in srgb, var(--sage) ${p}%, var(--cream))` }} />
                    ))}
                    More
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
