import { useState } from 'react'
import { T } from '../theme'
import { getTodayKey, MONTHS, DAY_HEADERS, getDaysInMonth, getFirstDay } from '../utils'

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

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const completedDays = cells.filter(d => {
    if (!d) return false
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return completions[selectedHabit]?.[key]
  }).length

  const totalDays = cells.filter(Boolean).filter(d => {
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return key <= today
  }).length

  const rate = totalDays > 0 ? Math.round(completedDays / totalDays * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans, padding: '32px 20px 40px' }}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, animation: 'fadeUp 0.5s ease both' }}>
          <button onClick={onBack} style={{
            background: T.card, border: `1.5px solid ${T.creamDark}`, borderRadius: 10,
            padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: T.inkSoft,
            fontFamily: T.sans, fontWeight: 600, transition: 'all 0.2s', boxShadow: T.shadow
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowHover; e.currentTarget.style.borderColor = T.accent }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.borderColor = T.creamDark }}
          >Back</button>
          <div>
            <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px' }}>Monthly</h1>
          </div>
        </div>

        {habits.length === 0 ? (
          <div style={{
            textAlign: 'center', color: T.inkMuted, padding: '48px 20px', fontSize: 15,
            fontFamily: T.serif, fontStyle: 'italic', animation: 'fadeUp 0.6s ease 0.1s both'
          }}>
            No habits to show yet.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, animation: 'fadeUp 0.5s ease 0.1s both' }}>
              {habits.map(h => {
                const active = selectedHabit === h.id
                return (
                  <button key={h.id} onClick={() => setSelectedHabit(h.id)} style={{
                    padding: '7px 16px', borderRadius: 99, border: '1.5px solid',
                    borderColor: active ? T.accent : T.creamDark,
                    background: active ? T.accent : T.card,
                    color: active ? '#fff' : T.inkSoft,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans,
                    transition: 'all 0.25s',
                    boxShadow: active ? '0 2px 8px var(--accent-glow)' : 'none'
                  }}>{h.name}</button>
                )
              })}
            </div>

            {selectedHabit && (
              <div style={{
                background: T.card, borderRadius: T.radius + 4, padding: 24,
                boxShadow: T.shadow, animation: 'fadeUp 0.5s ease 0.15s both'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <button onClick={prevMonth} style={{
                    background: T.cream, border: 'none', borderRadius: 8, width: 36, height: 36,
                    cursor: 'pointer', fontSize: 18, color: T.inkSoft, fontFamily: T.sans,
                    transition: 'all 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = T.creamDark}
                    onMouseLeave={e => e.currentTarget.style.background = T.cream}
                  >&lsaquo;</button>
                  <span style={{
                    fontFamily: T.serif, fontWeight: 700, fontSize: 17, color: T.ink,
                    letterSpacing: '-0.2px'
                  }}>
                    {MONTHS[viewMonth]} {viewYear}
                  </span>
                  <button onClick={nextMonth} disabled={isNextDisabled} style={{
                    background: isNextDisabled ? T.bg : T.cream, border: 'none', borderRadius: 8,
                    width: 36, height: 36, cursor: isNextDisabled ? 'default' : 'pointer',
                    fontSize: 18, color: isNextDisabled ? T.inkFaint : T.inkSoft,
                    fontFamily: T.sans, transition: 'all 0.2s'
                  }}>&rsaquo;</button>
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  {[
                    [T.sageLight, T.sage, completedDays, 'Done'],
                    [T.amberLight, T.amber, rate + '%', 'Rate'],
                    [T.accentLight, T.accent, totalDays - completedDays, 'Missed']
                  ].map(([bg, col, val, label]) => (
                    <div key={label} style={{
                      flex: 1, background: bg, borderRadius: 12, padding: '12px 10px', textAlign: 'center'
                    }}>
                      <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 800, color: col }}>{val}</div>
                      <div style={{
                        fontSize: 11, color: T.inkMuted, marginTop: 2, fontWeight: 500,
                        textTransform: 'uppercase', letterSpacing: '0.5px'
                      }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 6 }}>
                  {DAY_HEADERS.map(d => (
                    <div key={d} style={{
                      textAlign: 'center', fontSize: 11, color: T.inkMuted,
                      fontWeight: 600, padding: '4px 0'
                    }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
                  {cells.map((d, i) => {
                    if (!d) return <div key={`e-${i}`} />
                    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                    const done = completions[selectedHabit]?.[key]
                    const isFuture = key > today
                    const isToday = key === today
                    return (
                      <div key={key}
                        onClick={() => !isFuture && onToggle(selectedHabit, key)}
                        style={{
                          aspectRatio: '1', borderRadius: 8, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: isToday ? 800 : 500, fontFamily: T.sans,
                          cursor: isFuture ? 'default' : 'pointer', transition: 'all 0.2s',
                          background: done ? T.sage : isFuture ? 'transparent' : T.cream,
                          color: done ? '#fff' : isFuture ? T.inkFaint : isToday ? T.accent : T.inkSoft,
                          border: isToday ? `2px solid ${T.accent}` : '2px solid transparent',
                        }}>{d}</div>
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