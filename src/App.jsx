import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const USER_ID = 'user_default'

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function getDayLabel(dateStr) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  return days[new Date(dateStr + 'T00:00:00').getDay()]
}

function calcStreak(habitId, completions) {
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (completions[habitId]?.[key]) streak++
    else break
  }
  return streak
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function getDaysInMonth(y, m) { return new Date(y, m+1, 0).getDate() }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay() }

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

  return (
    <div style={{ minHeight:'100vh', background:'#f7f7f5', fontFamily:'Segoe UI, sans-serif', padding:'24px 16px' }}>
      <div style={{ maxWidth:480, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <button onClick={onBack} style={{ background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontSize:13, color:'#555', fontWeight:600 }}>← Back</button>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#1a1a1a', margin:0 }}>Monthly View</h1>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
          {habits.map(h => (
            <button key={h.id} onClick={() => setSelectedHabit(h.id)}
              style={{ padding:'6px 14px', borderRadius:99, border:'1.5px solid', borderColor: selectedHabit===h.id ? '#6c63ff':'#e8e8e8', background: selectedHabit===h.id ? '#6c63ff':'#fff', color: selectedHabit===h.id ? '#fff':'#555', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              {h.name}
            </button>
          ))}
        </div>
        {selectedHabit && (
          <div style={{ background:'#fff', borderRadius:20, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <button onClick={prevMonth} style={{ background:'#f0f0f0', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:16 }}>‹</button>
              <span style={{ fontWeight:700, fontSize:15 }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} disabled={isNextDisabled} style={{ background: isNextDisabled ? '#f9f9f9':'#f0f0f0', border:'none', borderRadius:8, width:32, height:32, cursor: isNextDisabled ? 'default':'pointer', fontSize:16, color: isNextDisabled ? '#ccc':'#333' }}>›</button>
            </div>
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              {[['#f5f3ff','#6c63ff',completedDays,'Done'],['#fff7ed','#f97316',(totalDays>0?Math.round(completedDays/totalDays*100):0)+'%','Rate'],['#f0fdf4','#22c55e',totalDays-completedDays,'Missed']].map(([bg,col,val,label]) => (
                <div key={label} style={{ flex:1, background:bg, borderRadius:12, padding:'10px 14px', textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:col }}>{val}</div>
                  <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
              {DAY_LABELS.map(d => <div key={d} style={{ textAlign:'center', fontSize:11, color:'#bbb', fontWeight:600 }}>{d}</div>)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {cells.map((d, i) => {
                if (!d) return <div key={`e-${i}`} />
                const key = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const done = completions[selectedHabit]?.[key]
                const isFuture = key > today
                const isToday = key === today
                return (
                  <div key={key} onClick={() => !isFuture && onToggle(selectedHabit, key)}
                    style={{ aspectRatio:'1', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight: isToday?800:500, cursor: isFuture?'default':'pointer', background: done?'#6c63ff':isFuture?'#fafafa':'#f0f0f0', color: done?'#fff':isFuture?'#ddd':isToday?'#6c63ff':'#555', border: isToday?'2px solid #6c63ff':'2px solid transparent' }}>
                    {d}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState({})
  const [newHabit, setNewHabit] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState('daily')
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
    if (error) { console.error('insert error:', error); alert('Error: ' + error.message); return }
    setHabits(h => [...h, habit])
    setNewHabit('')
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
  const pct = habits.length ? Math.round(todayTotal/habits.length*100) : 0

  if (!loaded) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#aaa', fontFamily:'sans-serif' }}>Loading...</div>
  if (view === 'monthly') return <MonthlyView habits={habits} completions={completions} onToggle={toggle} onBack={() => setView('daily')} />

  return (
    <div style={{ minHeight:'100vh', background:'#f7f7f5', fontFamily:'Segoe UI, sans-serif', padding:'24px 16px' }}>
      <div style={{ maxWidth:480, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:'#1a1a1a', margin:0 }}>My Habits</h1>
            <p style={{ color:'#888', fontSize:13, margin:'4px 0 0' }}>{new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
          </div>
          <button onClick={() => setView('monthly')} style={{ background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, padding:'8px 14px', cursor:'pointer', fontSize:13, color:'#6c63ff', fontWeight:700 }}>Monthly</button>
        </div>
        {habits.length > 0 && (
          <div style={{ background:'#fff', borderRadius:16, padding:'18px 20px', marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'#555' }}>Today's Progress</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#6c63ff' }}>{todayTotal}/{habits.length}</span>
            </div>
            <div style={{ background:'#f0f0f0', borderRadius:99, height:8 }}>
              <div style={{ background:'linear-gradient(90deg,#6c63ff,#a78bfa)', borderRadius:99, height:8, width:`${pct}%`, transition:'width 0.4s ease' }} />
            </div>
            <p style={{ fontSize:12, color:'#aaa', margin:'8px 0 0' }}>{pct===100 ? 'All done for today!' : `${pct}% complete`}</p>
          </div>
        )}
        <div style={{ marginBottom:20 }}>
          {habits.length === 0 && <div style={{ textAlign:'center', color:'#bbb', padding:'40px 0', fontSize:14 }}>No habits yet. Add one below!</div>}
          {habits.map(habit => {
            const streak = calcStreak(habit.id, completions)
            return (
              <div key={habit.id} style={{ background:'#fff', borderRadius:16, padding:'16px 18px', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <button onClick={() => toggle(habit.id, today)}
                      style={{ width:28, height:28, borderRadius:8, border:'2px solid', borderColor: completions[habit.id]?.[today]?'#6c63ff':'#ddd', background: completions[habit.id]?.[today]?'#6c63ff':'#fff', color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {completions[habit.id]?.[today] ? '✓' : ''}
                    </button>
                    <span style={{ fontWeight:600, fontSize:15, color: completions[habit.id]?.[today]?'#aaa':'#1a1a1a', textDecoration: completions[habit.id]?.[today]?'line-through':'none' }}>{habit.name}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {streak > 0 && <span style={{ fontSize:12, background:'#fff7ed', color:'#f97316', borderRadius:99, padding:'2px 8px', fontWeight:600 }}>{streak}d</span>}
                    <button onClick={() => removeHabit(habit.id)} style={{ background:'none', border:'none', color:'#ddd', cursor:'pointer', fontSize:16 }}>×</button>
                  </div>
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  {last7.map(d => (
                    <div key={d} style={{ flex:1, textAlign:'center' }}>
                      <div style={{ fontSize:9, color:'#ccc', marginBottom:3 }}>{getDayLabel(d)}</div>
                      <div onClick={() => toggle(habit.id, d)} style={{ width:'100%', aspectRatio:'1', borderRadius:6, background: completions[habit.id]?.[d]?'#6c63ff':'#f0f0f0', cursor:'pointer' }} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyDown={e => e.key==='Enter' && addHabit()}
            placeholder="Add a new habit..."
            style={{ flex:1, padding:'12px 16px', borderRadius:12, border:'1.5px solid #e8e8e8', fontSize:14, outline:'none', background:'#fff', color:'#1a1a1a' }} />
          <button onClick={addHabit} style={{ background:'#6c63ff', color:'#fff', border:'none', borderRadius:12, padding:'12px 18px', fontSize:18, cursor:'pointer', fontWeight:700 }}>+</button>
        </div>
      </div>
    </div>
  )
}
