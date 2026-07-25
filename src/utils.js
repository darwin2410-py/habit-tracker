export function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

export function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

export function getDayLabel(dateStr) {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(dateStr + 'T00:00:00').getDay()]
}

export function calcStreak(habitId, completions) {
  let streak = 0
  const today = new Date()
  const todayKey = today.toISOString().split('T')[0]
  const startFromToday = completions[habitId]?.[todayKey]
  for (let i = startFromToday ? 0 : 1; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (completions[habitId]?.[d.toISOString().split('T')[0]]) streak++
    else break
  }
  return streak
}

export function calcBestStreak(habitId, completions) {
  const dates = Object.keys(completions[habitId] || {}).sort()
  if (dates.length === 0) return 0
  let best = 1
  let current = 1
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000
    if (diff === 1) {
      current++
      best = Math.max(best, current)
    } else {
      current = 1
    }
  }
  return best
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