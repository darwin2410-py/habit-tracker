function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getTodayKey() {
  return localDateKey(new Date())
}

export function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return localDateKey(d)
  })
}

export function getDayLabel(dateStr) {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][parseDateKey(dateStr).getDay()]
}

export function isScheduled(habit, dateKey) {
  const freq = habit.frequency || { type: 'daily' }
  if (!freq || freq.type === 'daily') return true
  const day = parseDateKey(dateKey).getDay()
  return (freq.days || []).includes(day)
}

export function calcStreak(habitId, completions, habit) {
  let streak = 0
  const today = new Date()
  const todayKey = localDateKey(today)
  const startFromToday = completions[habitId]?.[todayKey] && isScheduled(habit || {}, todayKey)
  for (let i = startFromToday ? 0 : 1; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = localDateKey(d)
    if (!isScheduled(habit || {}, key)) continue
    if (completions[habitId]?.[key]) streak++
    else break
  }
  return streak
}

export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function calcBestStreak(habitId, completions, habit) {
  const done = completions[habitId] || {}
  const dates = Object.keys(done).filter(k => done[k]).sort()
  if (dates.length === 0) return 0
  const todayKey = localDateKey(new Date())
  let best = 0
  let current = 0
  for (let d = parseDateKey(dates[0]); ; d.setDate(d.getDate() + 1)) {
    const key = localDateKey(d)
    if (key > todayKey && key > dates[dates.length - 1]) break
    if (!isScheduled(habit || {}, key)) continue
    if (done[key]) {
      current++
      best = Math.max(best, current)
    } else if (key !== todayKey) {
      current = 0
    }
  }
  return best
}

// Moves an item inside a subset of the list (e.g. a filtered view)
// while keeping items outside the subset in their original slots.
export function reorderSubset(list, subsetIds, activeId, overId) {
  const subset = list.filter(x => subsetIds.includes(x.id))
  const from = subset.findIndex(x => x.id === activeId)
  const to = subset.findIndex(x => x.id === overId)
  if (from < 0 || to < 0 || from === to) return list
  const moved = [...subset]
  moved.splice(to, 0, moved.splice(from, 1)[0])
  let i = 0
  return list.map(x => subsetIds.includes(x.id) ? moved[i++] : x)
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function getDaysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate()
}

export function getFirstDay(y, m) {
  return new Date(y, m, 1).getDay()
}
// First day a habit counts toward stats: its creation date, or an earlier
// completion if one was backfilled. Null means no lower bound.
export function getStartKey(habit, habitCompletions = {}) {
  const created = habit?.created_at ? String(habit.created_at).slice(0, 10) : null
  if (!created) return null
  const first = Object.keys(habitCompletions).filter(k => habitCompletions[k]).sort()[0]
  return first && first < created ? first : created
}
