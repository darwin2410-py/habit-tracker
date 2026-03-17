import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const USER_ID = 'user_default'

// — Design Tokens —
const T = {
  bg: '#FAF8F4',
  card: '#FFFFFF',
  ink: '#2C2825',
  inkSoft: '#6B6560',
  inkMuted: '#A8A29E',
  inkFaint: '#D4D0CC',
  cream: '#F5F0E8',
  creamDark: '#EDE8DE',
  accent: '#C4653A',
  accentLight: '#F8EDE8',
  accentGlow: '#E8845A',
  sage: '#5B8C6F',
  sageLight: '#EDF5F0',
  sageDark: '#4A7A5E',
  amber: '#D49B3A',
  amberLight: '#FDF6E8',
  shadow: '0 1px 3px rgba(44,40,37,0.04), 0 4px 12px rgba(44,40,37,0.06)',
  shadowHover: '0 2px 8px rgba(44,40,37,0.08), 0 8px 24px rgba(44,40,37,0.1)',
  radius: 14,
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Source Sans 3', 'Segoe UI', sans-serif",
}

// — Utilities —
function getTodayKey() { return new Date().toISOString().split('T')[0] }

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function getDayLabel(dateStr) {
  return ['S','M','T','W','T','F','S'][new Date(dateStr + 'T00:00:00').getDay()]
}

function calcStreak(habitId, completions) {
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    if (completions[habitId]?.[d.toISOString().split('T')[0]]) streak++
    else break
  }
  return streak
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_HEADERS = ['Su','Mo','Tu','We','Th','Fr','Sa']
function getDaysInMonth(y, m) { return new Date(y, m+1, 0).getDate() }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay() }

// — Monthly View —
function MonthlyView({ habits, completions, onToggle, onBack }) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedHabit, setSelectedHabit] = useState(habits[0]?.id || null)
  const today = getTodayKey()
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDay(viewYear, viewMonth)
  const isNextDisabled = viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth())

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) }
    else setViewMonth(m => m-1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) }
    else setViewMonth(m => m+1)
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const completedDays = cells.filter(d => {
    if (!d) return false
    const key = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return completions[selectedHabit]?.[key]
  }).length

  const totalDays = cells.filter(Boolean).filter(d => {
    const key = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return key <= today
  }).length

  const rate = totalDays > 0 ? Math.round(completedDays / totalDays * 100) : 0

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.sans, padding:'32px 20px 40px' }}>
      <div style={{ maxWidth:440, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32, animation:'fadeUp 0.5s ease both' }}>
          <button onClick={onBack} style={{
            background:T.card, border:`1.5px solid ${T.creamDark}`, borderRadius:10, padding:'8px 14px',
            cursor:'pointer', fontSize:13, color:T.inkSoft, fontFamily:T.sans, fontWeight:600,
            transition:'all 0.2s', boxShadow:T.shadow
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowHover; e.currentTarget.style.borderColor = T.accent }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.borderColor = T.creamDark }}
          >Back</button>
          <div>
            <h1 style={{ fontFamily:T.serif, fontSize:26, fontWeight:700, color:T.ink, letterSpacing:'-0.3px' }}>Monthly</h1>
          </div>
        </div>

        {/* Habit Selector */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24, animation:'fadeUp 0.5s ease 0.1s both' }}>
          {habits.map(h => {
            const active = selectedHabit === h.id
            return (
              <button key={h.id} onClick={() => setSelectedHabit(h.id)} style={{
                padding:'7px 16px', borderRadius:99, border:'1.5px solid',
                borderColor: active ? T.accent : T.creamDark,
                background: active ? T.accent : T.card,
                color: active ? '#fff' : T.inkSoft,
                fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:T.sans,
                transition:'all 0.25s', boxShadow: active ? `0 2px 8px ${T.accent}40` : 'none'
              }}>{h.name}</button>
            )
          })}
        </div>

        {selectedHabit && (
          <div style={{ background:T.card, borderRadius:T.radius+4, padding:24, boxShadow:T.shadow, animation:'fadeUp 0.5s ease 0.15s both' }}>
            {/* Month Nav */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <button onClick={prevMonth} style={{
                background:T.cream, border:'none', borderRadius:8, width:36, height:36,
                cursor:'pointer', fontSize:18, color:T.inkSoft, fontFamily:T.sans, transition:'all 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = T.creamDark}
                onMouseLeave={e => e.currentTarget.style.background = T.cream}
              >&lsaquo;</button>
              <span style={{ fontFamily:T.serif, fontWeight:700, fontSize:17, color:T.ink, letterSpacing:'-0.2px' }}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button onClick={nextMonth} disabled={isNextDisabled} style={{
                background: isNextDisabled ? T.bg : T.cream, border:'none', borderRadius:8, width:36, height:36,
                cursor: isNextDisabled ? 'default' : 'pointer', fontSize:18,
                color: isNextDisabled ? T.inkFaint : T.inkSoft, fontFamily:T.sans, transition:'all 0.2s'
              }}>&rsaquo;</button>
            </div>

            {/* Stats */}
            <div style={{ display:'flex', gap:10, marginBottom:20 }}>
              {[
                [T.sageLight, T.sage, completedDays, 'Done'],
                [T.amberLight, T.amber, rate+'%', 'Rate'],
                [T.accentLight, T.accent, totalDays-completedDays, 'Missed']
              ].map(([bg, col, val, label]) => (
                <div key={label} style={{
                  flex:1, background:bg, borderRadius:12, padding:'12px 10px', textAlign:'center'
                }}>
                  <div style={{ fontFamily:T.serif, fontSize:22, fontWeight:800, color:col }}>{val}</div>
                  <div style={{ fontSize:11, color:T.inkMuted, marginTop:2, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Calendar */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:6 }}>
              {DAY_HEADERS.map(d => (
                <div key={d} style={{ textAlign:'center', fontSize:11, color:T.inkMuted, fontWeight:600, padding:'4px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
              {cells.map((d, i) => {
                if (!d) return <div key={`e-${i}`} />
                const key = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const done = completions[selectedHabit]?.[key]
                const isFuture = key > today
                const isToday = key === today
                return (
                  <div key={key} onClick={() => !isFuture && onToggle(selectedHabit, key)} style={{
                    aspectRatio:'1', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight: isToday ? 800 : 500, fontFamily:T.sans,
                    cursor: isFuture ? 'default' : 'pointer', transition:'all 0.2s',
                    background: done ? T.sage : isFuture ? 'transparent' : T.cream,
                    color: done ? '#fff' : isFuture ? T.inkFaint : isToday ? T.accent : T.inkSoft,
                    border: isToday ? `2px solid ${T.accent}` : '2px solid transparent',
                  }}>{d}</div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// — Main App —
export default function App() {
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState({})
  const [newHabit, setNewHabit] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState('daily')
  const inputRef = useRef(null)
  const today = getTodayKey()
  const last7 = getLast7Days()

  useEffect(() => {
    async function load() {
      const { data: h, error: e1 } = await supabase.from('habits').select('*').eq('user_id', USER_ID)
      const { data: c, error: e2 } = await supabase.from('completions').select('*').eq('user_id', USER_ID)
      if (e1) console.error('habits error:', e1)
      if (e2) console.error('completions error:', e2)
      if (h) setHabits(h)
      if (c) {
        const map = {}
        c.forEach(({ habit_id, date_key }) => {
          if (!map[habit_id]) map[habit_id] = {}
          map[habit_id][date_key] = true
        })
        setCompletions(map)
      }
      setLoaded(true)
    }
    load()
  }, [])

  async function addHabit() {
    const name = newHabit.trim()
    if (!name) return
    const id = Date.now().toString()
    const habit = { id, name, created_at: today, user_id: USER_ID }
    const { error } = await supabase.from('habits').insert(habit)
    if (error) { console.error('insert error:', error); return }
    setHabits(h => [...h, habit])
    setNewHabit('')
    inputRef.current?.focus()
  }

  async function removeHabit(id) {
    await supabase.from('habits').delete().eq('id', id)
    setHabits(h => h.filter(x => x.id !== id))
    setCompletions(c => { const n = {...c}; delete n[id]; return n })
  }

  async function toggle(habitId, dateKey) {
    const done = completions[habitId]?.[dateKey]
    if (done) {
      await supabase.from('completions').delete().eq('habit_id', habitId).eq('date_key', dateKey)
    } else {
      await supabase.from('completions').insert({ habit_id: habitId, date_key: dateKey, user_id: USER_ID })
    }
    setCompletions(c => ({ ...c, [habitId]: { ...(c[habitId]||{}), [dateKey]: !done } }))
  }

  const todayTotal = habits.filter(h => completions[h.id]?.[today]).length
  const pct = habits.length ? Math.round(todayTotal / habits.length * 100) : 0

  if (!loaded) return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      height:'100vh', background:T.bg, fontFamily:T.serif, color:T.inkMuted, gap:12
    }}>
      <div style={{ fontSize:28, animation:'pulse 1.5s ease infinite', color:T.accent }}>~</div>
      <div style={{ fontSize:14, fontFamily:T.sans, fontWeight:500, letterSpacing:'1px', textTransform:'uppercase' }}>Loading</div>
    </div>
  )

  if (view === 'monthly') return <MonthlyView habits={habits} completions={completions} onToggle={toggle} onBack={() => setView('daily')} />

  const dateStr = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })

  return (
    <div style={{
      minHeight:'100vh', background:T.bg, fontFamily:T.sans,
      padding:'36px 20px 40px',
      backgroundImage:`radial-gradient(${T.creamDark} 0.5px, transparent 0.5px)`,
      backgroundSize:'24px 24px'
    }}>
      <div style={{ maxWidth:440, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:32, animation:'fadeUp 0.5s ease both' }}>
          <div>
            <p style={{ fontSize:13, fontWeight:500, color:T.inkMuted, marginBottom:4, textTransform:'uppercase', letterSpacing:'1.5px' }}>{dateStr}</p>
            <h1 style={{ fontFamily:T.serif, fontSize:32, fontWeight:800, color:T.ink, letterSpacing:'-0.5px', lineHeight:1.1 }}>
              My Habits
            </h1>
          </div>
          <button onClick={() => setView('monthly')} style={{
            background:T.card, border:`1.5px solid ${T.creamDark}`, borderRadius:10, padding:'9px 16px',
            cursor:'pointer', fontSize:13, color:T.accent, fontWeight:700, fontFamily:T.sans,
            transition:'all 0.25s', boxShadow:T.shadow, marginTop:4
          }}
            onMouseEnter={e => { e.currentTarget.style.background = T.accentLight; e.currentTarget.style.borderColor = T.accent }}
            onMouseLeave={e => { e.currentTarget.style.background = T.card; e.currentTarget.style.borderColor = T.creamDark }}
          >Monthly</button>
        </div>

        {/* Progress */}
        {habits.length > 0 && (
          <div style={{
            background:T.card, borderRadius:T.radius+2, padding:'20px 22px', marginBottom:24,
            boxShadow:T.shadow, animation:'fadeUp 0.5s ease 0.05s both'
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
              <span style={{ fontSize:13, fontWeight:600, color:T.inkSoft, textTransform:'uppercase', letterSpacing:'0.5px' }}>Today's Progress</span>
              <span style={{ fontFamily:T.serif, fontSize:20, fontWeight:800, color: pct === 100 ? T.sage : T.accent }}>
                {todayTotal}<span style={{ fontSize:14, fontWeight:500, color:T.inkMuted }}>/{habits.length}</span>
              </span>
            </div>
            <div style={{ background:T.cream, borderRadius:99, height:6, overflow:'hidden' }}>
              <div style={{
                background: pct === 100
                  ? `linear-gradient(90deg, ${T.sage}, ${T.sageDark})`
                  : `linear-gradient(90deg, ${T.accent}, ${T.accentGlow})`,
                borderRadius:99, height:6, width:`${pct}%`,
                transition:'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            </div>
            {pct === 100 && (
              <p style={{ fontSize:12, color:T.sage, margin:'10px 0 0', fontWeight:600, fontStyle:'italic' }}>
                All done for today. Well done.
              </p>
            )}
          </div>
        )}

        {/* Habits List */}
        <div style={{ marginBottom:24 }}>
          {habits.length === 0 && (
            <div style={{
              textAlign:'center', color:T.inkMuted, padding:'48px 20px', fontSize:15,
              fontFamily:T.serif, fontStyle:'italic', animation:'fadeUp 0.6s ease 0.1s both'
            }}>
              No habits yet — start with one below.
            </div>
          )}

          {habits.map((habit, idx) => {
            const streak = calcStreak(habit.id, completions)
            const done = completions[habit.id]?.[today]
            return (
              <div key={habit.id} style={{
                background:T.card, borderRadius:T.radius, padding:'18px 20px', marginBottom:14,
                boxShadow:T.shadow, transition:'all 0.3s',
                animation:`fadeUp 0.5s ease ${0.08 + idx * 0.05}s both`,
                borderLeft: done ? `3px solid ${T.sage}` : `3px solid transparent`,
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadowHover}
                onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <button onClick={() => toggle(habit.id, today)} style={{
                      width:26, height:26, borderRadius:7, border:'2px solid',
                      borderColor: done ? T.sage : T.inkFaint,
                      background: done ? T.sage : 'transparent',
                      color:'#fff', fontSize:13, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      transition:'all 0.25s',
                      animation: done ? 'checkPop 0.3s ease' : 'none',
                    }}
                      onMouseEnter={e => { if (!done) e.currentTarget.style.borderColor = T.sage }}
                      onMouseLeave={e => { if (!done) e.currentTarget.style.borderColor = T.inkFaint }}
                    >{done ? '✓' : ''}</button>
                    <span style={{
                      fontWeight:600, fontSize:15, color: done ? T.inkMuted : T.ink,
                      textDecoration: done ? 'line-through' : 'none',
                      textDecorationColor: T.inkFaint,
                      transition:'all 0.3s',
                    }}>{habit.name}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {streak > 0 && (
                      <span style={{
                        fontSize:12, background:T.amberLight, color:T.amber, borderRadius:99,
                        padding:'3px 10px', fontWeight:700, letterSpacing:'-0.2px',
                      }}>{streak}d</span>
                    )}
                    <button onClick={() => removeHabit(habit.id)} style={{
                      background:'none', border:'none', color:T.inkFaint, cursor:'pointer',
                      fontSize:18, padding:'0 2px', transition:'color 0.2s', lineHeight:1
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = T.accent}
                      onMouseLeave={e => e.currentTarget.style.color = T.inkFaint}
                    >&times;</button>
                  </div>
                </div>

                {/* 7-day grid */}
                <div style={{ display:'flex', gap:6 }}>
                  {last7.map(d => {
                    const dayDone = completions[habit.id]?.[d]
                    const isToday = d === today
                    return (
                      <div key={d} style={{ flex:1, textAlign:'center' }}>
                        <div style={{
                          fontSize:10, color: isToday ? T.accent : T.inkMuted, marginBottom:4,
                          fontWeight: isToday ? 700 : 500
                        }}>{getDayLabel(d)}</div>
                        <div onClick={() => toggle(habit.id, d)} style={{
                          width:'100%', aspectRatio:'1', borderRadius:6,
                          background: dayDone ? T.sage : T.cream,
                          cursor:'pointer', transition:'all 0.2s',
                          border: isToday ? `1.5px solid ${T.accent}` : '1.5px solid transparent',
                          animation: dayDone ? 'scaleIn 0.2s ease' : 'none',
                        }}
                          onMouseEnter={e => { if (!dayDone) e.currentTarget.style.background = T.sageLight }}
                          onMouseLeave={e => { if (!dayDone) e.currentTarget.style.background = T.cream }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Habit */}
        <div style={{
          display:'flex', gap:10, animation:'fadeUp 0.5s ease 0.3s both'
        }}>
          <input ref={inputRef} value={newHabit} onChange={e => setNewHabit(e.target.value)}
            onKeyDown={e => e.key==='Enter' && addHabit()}
            placeholder="What will you build?"
            style={{
              flex:1, padding:'13px 18px', borderRadius:12, border:`1.5px solid ${T.creamDark}`,
              fontSize:14, outline:'none', background:T.card, color:T.ink,
              fontFamily:T.sans, fontWeight:500, transition:'all 0.25s', boxShadow:T.shadow,
            }}
            onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accent}18` }}
            onBlur={e => { e.target.style.borderColor = T.creamDark; e.target.style.boxShadow = T.shadow }}
          />
          <button onClick={addHabit} style={{
            background:T.accent, color:'#fff', border:'none', borderRadius:12,
            padding:'13px 20px', fontSize:20, cursor:'pointer', fontWeight:700,
            transition:'all 0.25s', boxShadow:`0 2px 8px ${T.accent}30`,
            lineHeight:1, fontFamily:T.sans,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = T.accentGlow; e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseLeave={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.transform = 'scale(1)' }}
          >+</button>
        </div>

        {/* Footer */}
        <div style={{
          textAlign:'center', marginTop:40, fontSize:11, color:T.inkFaint,
          fontFamily:T.serif, fontStyle:'italic', letterSpacing:'0.5px'
        }}>
          small steps, every day
        </div>
      </div>
    </div>
  )
}
