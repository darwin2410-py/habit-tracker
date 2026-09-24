import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { getTodayKey, getLast7Days, isScheduled, reorderSubset } from './utils'
import { useTheme } from './hooks/useTheme'
import Toast from './components/Toast'
import Confetti from './components/Confetti'
import { makeConfetti } from './confetti'
import MonthlyView from './components/MonthlyView'
import HabitCard from './components/HabitCard'
import FrequencyPicker from './components/FrequencyPicker'
import CategoryPicker from './components/CategoryPicker'
import CategoryChips from './components/CategoryChips'

const USER_ID = 'user_default'
const UNDO_MS = 5000

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function frequencyLabel(freq) {
  if (freq.type === 'weekdays') return 'Weekdays'
  if (freq.type === 'weekends') return 'Weekends'
  if (freq.type === 'custom') return freq.days?.length ? freq.days.map(d => DAY_NAMES[d]).join(', ') : 'Pick days'
  return 'Every day'
}

function sortHabits(list) {
  return [...list].sort((a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity))
}

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
  const [toast, setToast] = useState(null)
  const [confetti, setConfetti] = useState(null)
  const inputRef = useRef(null)
  const toastId = useRef(0)
  const pendingDelete = useRef(null)
  const today = getTodayKey()
  const last7 = getLast7Days()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function showToast(message, type = 'success', extra = {}) {
    setToast({ message, type, key: ++toastId.current, ...extra })
  }

  const hideToast = useCallback(() => setToast(null), [])
  const hideConfetti = useCallback(() => setConfetti(null), [])

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
      if (h) setHabits(sortHabits(h))
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
    const id = crypto.randomUUID()
    const sort_order = habits.reduce((max, h) => Math.max(max, h.sort_order ?? -1), -1) + 1
    const habit = { id, name, created_at: today, user_id: USER_ID, frequency, category_id: categoryId, sort_order }
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

  // Deleting hides the habit right away and only removes it from the
  // database once the undo window has passed.
  function deleteHabit(habit) {
    commitDelete()
    const index = habits.findIndex(h => h.id === habit.id)
    const habitCompletions = completions[habit.id]
    setHabits(h => h.filter(x => x.id !== habit.id))
    setCompletions(c => { const n = { ...c }; delete n[habit.id]; return n })
    if (editingId === habit.id) setEditingId(null)
    pendingDelete.current = { habit, index, habitCompletions, timer: setTimeout(commitDelete, UNDO_MS) }
    showToast('Habit deleted', 'success', { duration: UNDO_MS, action: { label: 'Undo', onClick: undoDelete } })
  }

  function restoreHabit({ habit, index, habitCompletions }) {
    setHabits(h => { const n = [...h]; n.splice(Math.min(index, n.length), 0, habit); return n })
    if (habitCompletions) setCompletions(c => ({ ...c, [habit.id]: habitCompletions }))
  }

  function undoDelete() {
    const pending = pendingDelete.current
    if (!pending) return
    clearTimeout(pending.timer)
    pendingDelete.current = null
    restoreHabit(pending)
    setToast(null)
  }

  async function commitDelete() {
    const pending = pendingDelete.current
    if (!pending) return
    clearTimeout(pending.timer)
    pendingDelete.current = null
    const { error } = await supabase.from('habits').delete().eq('id', pending.habit.id)
    if (error) {
      console.error('delete error:', error)
      restoreHabit(pending)
      showToast('Failed to delete', 'error')
    }
  }

  useEffect(() => {
    window.addEventListener('pagehide', commitDelete)
    return () => window.removeEventListener('pagehide', commitDelete)
  })

  async function toggle(habitId, dateKey) {
    const done = completions[habitId]?.[dateKey]
    if (!done && dateKey === today) {
      const due = habits.filter(h => isScheduled(h, today))
      if (due.every(h => h.id === habitId || completions[h.id]?.[today])) setConfetti(makeConfetti())
    }
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
    const id = 'cat_' + crypto.randomUUID()
    const cat = { id, name, color, user_id: USER_ID }
    const { error } = await supabase.from('categories').insert(cat)
    if (error) { console.error('category insert error:', error); showToast('Failed to create category', 'error'); return }
    setCategories(c => [...c, cat])
    setCategoryId(id)
  }

  async function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const group = [dueHabits, restHabits].find(g => g.some(h => h.id === active.id))
    if (!group.some(h => h.id === over.id)) return
    const prev = habits
    const next = reorderSubset(prev, group.map(h => h.id), active.id, over.id)
      .map((h, i) => ({ ...h, sort_order: i }))
    setHabits(next)
    const changed = next.filter((h, i) => prev[i].id !== h.id || prev[i].sort_order !== i)
    const results = await Promise.all(changed.map(h =>
      supabase.from('habits').update({ sort_order: h.sort_order }).eq('id', h.id)
    ))
    const failed = results.find(r => r.error)
    if (failed) {
      console.error('reorder error:', failed.error)
      showToast('Failed to save order', 'error')
      setHabits(prev)
    }
  }

  function startEdit(habitId, habitName, freq, catId) {
    setEditingId(habitId)
    setEditName(habitName)
    setEditingFreq(freq || { type: 'daily' })
    setEditingCatId(catId || null)
  }

  const visibleHabits = habits.filter(h => !categoryFilter || h.category_id === categoryFilter)
  const dueHabits = visibleHabits.filter(h => isScheduled(h, today))
  const restHabits = visibleHabits.filter(h => !isScheduled(h, today))
  const dueToday = habits.filter(h => isScheduled(h, today))
  const todayTotal = dueToday.filter(h => completions[h.id]?.[today]).length
  const pct = dueToday.length ? Math.round(todayTotal / dueToday.length * 100) : 0

  if (!loaded) return (
    <div className="loading serif">
      <div className="loading-mark">~</div>
      <div className="loading-text">Loading</div>
    </div>
  )

  if (view === 'monthly') return <MonthlyView habits={habits} completions={completions} onToggle={toggle} onBack={() => setView('daily')} />

  const cardProps = {
    completions, today, last7, categories,
    editingId, editName, setEditName,
    editingFreq, setEditingFreq,
    editingCatId, setEditingCatId,
    onToggle: toggle, onStartEdit: startEdit,
    onRename: renameHabit, onCancelEdit: () => setEditingId(null),
  }
  const selectedCategory = categories.find(c => c.id === categoryId)
  const dateStr = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })

  return (
    <div className="page dotted">
      <div className="container">

        {/* Header */}
        <div className="header fade-up">
          <div>
            <p className="header-date">{dateStr}</p>
            <h1 className="serif">My Habits</h1>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => setView('monthly')}>Monthly</button>
            <button className="btn-outline btn-theme" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? '\u2600' : '\u263D'}
            </button>
          </div>
        </div>

        {/* Progress */}
        {habits.length > 0 && (
          <div className="card progress fade-up" style={{ animationDelay: '0.05s' }}>
            <div className="progress-head">
              <span className="progress-label">Today's Progress</span>
              <span className={`progress-count serif${pct === 100 ? ' complete' : ''}`}>
                {todayTotal}<small>/{dueToday.length}</small>
              </span>
            </div>
            <div className="progress-track">
              <div className={`progress-bar${pct === 100 ? ' complete' : ''}`} style={{ width: `${pct}%` }} />
            </div>
            {dueToday.length === 0 ? (
              <p className="progress-note rest">Nothing scheduled today. Enjoy the rest.</p>
            ) : pct === 100 && (
              <p className="progress-note">All done for today. Well done.</p>
            )}
          </div>
        )}

        {/* Add Habit */}
        <div className="add-box fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="add-row">
            <input ref={inputRef} className="input add-input" value={newHabit}
              onChange={e => setNewHabit(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHabit()}
              placeholder="What will you build?"
              aria-label="New habit name"
            />
            <button className="add-btn" onClick={addHabit} aria-label="Add habit">+</button>
          </div>

          <div className="add-options">
            <button className={`option-btn${showFreqPicker ? ' open' : ''}`} aria-expanded={showFreqPicker}
              onClick={() => { setShowFreqPicker(p => !p); setShowCategoryPicker(false) }}>
              &#8635; {frequencyLabel(frequency)} <small>{showFreqPicker ? '\u25B2' : '\u25BC'}</small>
            </button>
            <button className={`option-btn${showCategoryPicker ? ' open' : ''}`} aria-expanded={showCategoryPicker}
              onClick={() => { setShowCategoryPicker(p => !p); setShowFreqPicker(false) }}>
              {selectedCategory
                ? <><span className="chip-dot" style={{ '--chip-color': selectedCategory.color }} />{selectedCategory.name}</>
                : 'No category'} <small>{showCategoryPicker ? '\u25B2' : '\u25BC'}</small>
            </button>
            {showFreqPicker && (
              <FrequencyPicker frequency={frequency} onChange={f => { setFrequency(f); if (newHabit) inputRef.current?.focus() }} />
            )}
            {showCategoryPicker && (
              <CategoryPicker
                categories={categories}
                selectedId={categoryId}
                onChange={id => { setCategoryId(id); if (newHabit) inputRef.current?.focus() }}
                onCreate={createCategory}
              />
            )}
          </div>
        </div>

        {/* Category filter */}
        {(categories.length > 0 || categoryFilter) && (
          <div className="fade-up" style={{ marginBottom: 16 }}>
            <CategoryChips categories={categories} selectedId={categoryFilter} onChange={setCategoryFilter} emptyLabel="All" />
          </div>
        )}

        {/* Habits List */}
        {habits.length === 0 && (
          <div className="empty fade-up" style={{ animationDelay: '0.15s' }}>
            No habits yet. Add your first one above.
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={dueHabits.map(h => h.id)} strategy={verticalListSortingStrategy}>
            {dueHabits.map((habit, idx) => (
              <HabitCard key={habit.id} habit={habit} idx={idx} {...cardProps}
                onDelete={() => deleteHabit(habit)}
                category={categories.find(c => c.id === habit.category_id) || null} />
            ))}
          </SortableContext>

          {restHabits.length > 0 && <div className="group-label">Rest day</div>}
          <SortableContext items={restHabits.map(h => h.id)} strategy={verticalListSortingStrategy}>
            {restHabits.map((habit, idx) => (
              <HabitCard key={habit.id} habit={habit} idx={dueHabits.length + idx} rest {...cardProps}
                onDelete={() => deleteHabit(habit)}
                category={categories.find(c => c.id === habit.category_id) || null} />
            ))}
          </SortableContext>
        </DndContext>

        <div className="footer serif">small steps, every day</div>
      </div>

      {toast && <Toast key={toast.key} message={toast.message} type={toast.type}
        action={toast.action} duration={toast.duration} onDone={hideToast} />}
      {confetti && <Confetti pieces={confetti} onDone={hideConfetti} />}
    </div>
  )
}
