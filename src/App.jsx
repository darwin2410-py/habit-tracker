import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { T } from './theme'
import { getTodayKey, getLast7Days } from './utils'
import { useTheme } from './hooks/useTheme'
import Toast from './components/Toast'
import ConfirmDialog from './components/ConfirmDialog'
import MonthlyView from './components/MonthlyView'
import HabitCard from './components/HabitCard'
import FrequencyPicker from './components/FrequencyPicker'
import CategoryPicker from './components/CategoryPicker'

const USER_ID = 'user_default'

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState({})
  const [newHabit, setNewHabit] = useState('')
  const [frequency, setFrequency] = useState({ type: 'daily' })
  const [showFreqPicker, setShowFreqPicker] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [categoryId, setCategoryId] = useState(null)
  const [categories, setCategories] = useState([])
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState('daily')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editingFreq, setEditingFreq] = useState(null)
  const [editingCatId, setEditingCatId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const inputRef = useRef(null)
  const today = getTodayKey()
  const last7 = getLast7Days()

  function showToast(message, type = 'success') {
    setToast({ message, type, key: Date.now() })
  }

  useEffect(() => {
    async function load() {
      const [{ data: h, error: e1 }, { data: c, error: e2 }, { data: cats, error: e3 }] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', USER_ID),
        supabase.from('completions').select('*').eq('user_id', USER_ID),
        supabase.from('categories').select('*').eq('user_id', USER_ID)
      ])
      if (e1) console.error('habits error:', e1)
      if (e2) console.error('completions error:', e2)
      if (e3) console.error('categories error:', e3)
      if (h) setHabits(h)
      if (cats) setCategories(cats)
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
    const habit = { id, name, created_at: today, user_id: USER_ID, frequency, category_id: categoryId }
    const { error } = await supabase.from('habits').insert(habit)
    if (error) { console.error('insert error:', error); showToast('Failed to add habit', 'error'); return }
    setHabits(h => [...h, habit])
    setNewHabit('')
    setFrequency({ type: 'daily' })
    setCategoryId(null)
    setShowFreqPicker(false)
    setShowCategoryPicker(false)
    inputRef.current?.focus()
  }

  async function renameHabit(id) {
    const name = editName.trim()
    if (!name) { setEditingId(null); return }
    const updates = { name }
    const h = habits.find(x => x.id === id)
    const freqChanged = JSON.stringify(editingFreq) !== JSON.stringify(h?.frequency || { type: 'daily' })
    const catChanged = editingCatId !== (h?.category_id || null)
    if (freqChanged) updates.frequency = editingFreq
    if (catChanged) updates.category_id = editingCatId
    const { error } = await supabase.from('habits').update(updates).eq('id', id)
    if (error) { console.error('rename error:', error); showToast('Failed to save', 'error'); return }
    setHabits(hh => hh.map(x => x.id === id ? { ...x, ...updates } : x))
    setEditingId(null)
  }

  async function removeHabit(id) {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) { console.error('delete error:', error); showToast('Failed to delete', 'error'); return }
    setHabits(h => h.filter(x => x.id !== id))
    setCompletions(c => { const n = {...c}; delete n[id]; return n })
    setDeleteTarget(null)
    showToast('Habit deleted')
  }

  async function toggle(habitId, dateKey) {
    const done = completions[habitId]?.[dateKey]
    // Optimistic update
    setCompletions(c => ({ ...c, [habitId]: { ...(c[habitId]||{}), [dateKey]: !done } }))
    if (done) {
      const { error } = await supabase.from('completions').delete().eq('habit_id', habitId).eq('date_key', dateKey)
      if (error) {
        console.error('toggle error:', error)
        showToast('Failed to update', 'error')
        // Rollback
        setCompletions(c => ({ ...c, [habitId]: { ...(c[habitId]||{}), [dateKey]: true } }))
      }
    } else {
      const { error } = await supabase.from('completions').insert({ habit_id: habitId, date_key: dateKey, user_id: USER_ID })
      if (error) {
        console.error('toggle error:', error)
        showToast('Failed to update', 'error')
        // Rollback
        setCompletions(c => ({ ...c, [habitId]: { ...(c[habitId]||{}), [dateKey]: false } }))
      }
    }
  }

  async function createCategory(name, color) {
    const id = 'cat_' + Date.now().toString()
    const cat = { id, name, color, user_id: USER_ID }
    const { error } = await supabase.from('categories').insert(cat)
    if (error) { console.error('category insert error:', error); showToast('Failed to create category', 'error'); return }
    setCategories(c => [...c, cat])
    setCategoryId(id)
  }

  function startEdit(habitId, habitName, freq, catId) {
    setEditingId(habitId)
    setEditName(habitName)
    setEditingFreq(freq || { type: 'daily' })
    setEditingCatId(catId || null)
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
          <button onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} style={{
            background:T.card, border:`1.5px solid ${T.creamDark}`, borderRadius:10, padding:'9px 12px',
            cursor:'pointer', fontSize:16, color:T.inkSoft, fontFamily:T.sans,
            transition:'all 0.25s', boxShadow:T.shadow, marginTop:4, lineHeight:1,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = T.amber; e.currentTarget.style.borderColor = T.amber }}
            onMouseLeave={e => { e.currentTarget.style.color = T.inkSoft; e.currentTarget.style.borderColor = T.creamDark }}
          >{theme === 'dark' ? '\u2600' : '\u263D'}</button>
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
        {(categories.length > 0 || categoryFilter) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, animation: 'fadeUp 0.4s ease both' }}>
            <button onClick={() => setCategoryFilter(null)} style={{
              padding: '4px 12px', borderRadius: 99, border: '1.5px solid',
              borderColor: !categoryFilter ? T.accent : T.creamDark,
              background: !categoryFilter ? T.accent : 'transparent',
              color: !categoryFilter ? '#fff' : T.inkSoft,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans,
            }}>All</button>
            {categories.map(c => {
              const active = categoryFilter === c.id
              return (
                <button key={c.id} onClick={() => setCategoryFilter(active ? null : c.id)} style={{
                  padding: '4px 12px', borderRadius: 99, border: '1.5px solid',
                  borderColor: active ? c.color : T.creamDark,
                  background: active ? c.color : 'transparent',
                  color: active ? '#fff' : T.inkSoft,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans,
                  transition: 'all 0.2s',
                }}>{c.name}</button>
              )
            })}
          </div>
        )}
        <div style={{ marginBottom: 24 }}>
          {habits.length === 0 && (
            <div style={{
              textAlign:'center', color:T.inkMuted, padding:'48px 20px', fontSize:15,
              fontFamily:T.serif, fontStyle:'italic', animation:'fadeUp 0.6s ease 0.1s both'
            }}>
              No habits yet — start with one below.
            </div>
          )}

          {habits
          .filter(h => !categoryFilter || h.category_id === categoryFilter)
          .map((habit, idx) => (
            <HabitCard key={habit.id} habit={habit} idx={idx} completions={completions}
              today={today} last7={last7}
              editingId={editingId} editName={editName} setEditName={setEditName}
              editingFreq={editingFreq} setEditingFreq={setEditingFreq}
              editingCatId={editingCatId} setEditingCatId={setEditingCatId}
              onToggle={toggle} onStartEdit={startEdit}
              onRename={renameHabit} onCancelEdit={() => setEditingId(null)}
              onDelete={() => setDeleteTarget(habit)}
              category={categories.find(c => c.id === habit.category_id) || null}
              categories={categories} />
          ))}
        </div>

        {/* Add Habit */}
        <div style={{ display:'flex', gap:10, animation:'fadeUp 0.5s ease 0.3s both' }}>
          <input ref={inputRef} value={newHabit} onChange={e => setNewHabit(e.target.value)}
            onKeyDown={e => e.key==='Enter' && addHabit()}
            placeholder="What will you build?"
            style={{
              flex:1, padding:'13px 18px', borderRadius:12, border:`1.5px solid ${T.creamDark}`,
              fontSize:14, outline:'none', background:T.card, color:T.ink,
              fontFamily:T.sans, fontWeight:500, transition:'all 0.25s', boxShadow:T.shadow,
            }}
            onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)' }}
            onBlur={e => { e.target.style.borderColor = T.creamDark; e.target.style.boxShadow = T.shadow }}
          />
          <button onClick={addHabit} style={{
            background:T.accent, color:'#fff', border:'none', borderRadius:12,
            padding:'13px 20px', fontSize:20, cursor:'pointer', fontWeight:700,
            transition:'all 0.25s', boxShadow:'0 2px 8px var(--accent-shadow)',
            lineHeight:1, fontFamily:T.sans,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = T.accentGlow; e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseLeave={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.transform = 'scale(1)' }}
          >+</button>
        </div>

        {/* Frequency Picker */}
        <div style={{ marginTop: 10, animation: 'fadeUp 0.5s ease 0.35s both' }}>
          <button onClick={() => setShowFreqPicker(p => !p)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: T.inkMuted, fontFamily: T.sans, fontWeight: 500,
            padding: 0, display: 'flex', alignItems: 'center', gap: 4,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = T.accent}
            onMouseLeave={e => e.currentTarget.style.color = T.inkMuted}
          >{frequency.type === 'daily' ? 'Every day' : `Repeats: ${frequency.type}`} <span style={{ fontSize: 10 }}>{showFreqPicker ? '\u25B2' : '\u25BC'}</span></button>
          {showFreqPicker && (
            <FrequencyPicker frequency={frequency} onChange={f => { setFrequency(f); if (newHabit) inputRef.current?.focus() }} style={{ marginTop: 8 }} />
          )}
          <button onClick={() => setShowCategoryPicker(p => !p)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: T.inkMuted, fontFamily: T.sans, fontWeight: 500,
            padding: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = T.accent}
            onMouseLeave={e => e.currentTarget.style.color = T.inkMuted}
          >{categoryId ? categories.find(c => c.id === categoryId)?.name || 'Category' : 'Add category'} <span style={{ fontSize: 10 }}>{showCategoryPicker ? '\u25B2' : '\u25BC'}</span></button>
          {showCategoryPicker && (
            <CategoryPicker
              categories={categories}
              selectedId={categoryId}
              onChange={id => { setCategoryId(id); if (newHabit) inputRef.current?.focus() }}
              onCreate={createCategory}
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign:'center', marginTop:40, fontSize:11, color:T.inkFaint,
          fontFamily:T.serif, fontStyle:'italic', letterSpacing:'0.5px'
        }}>
          small steps, every day
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete habit?"
          message={`"${deleteTarget.name}" and all its history will be permanently removed.`}
          onConfirm={() => removeHabit(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
