import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { calcStreak, calcBestStreak, isScheduled, reorderSubset } from './utils'

const daily = { type: 'daily' }
const weekdays = { frequency: { type: 'weekdays', days: [1, 2, 3, 4, 5] } }

function done(...keys) {
  return { h: Object.fromEntries(keys.map(k => [k, true])) }
}

// 2026-09-24 is a Thursday
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 24, 10))
})
afterEach(() => vi.useRealTimers())

describe('isScheduled', () => {
  it('daily is always scheduled', () => {
    expect(isScheduled({}, '2026-09-26')).toBe(true)
  })
  it('weekdays skips weekends', () => {
    expect(isScheduled(weekdays, '2026-09-25')).toBe(true)
    expect(isScheduled(weekdays, '2026-09-26')).toBe(false)
  })
})

describe('calcStreak', () => {
  it('counts back from yesterday when today is not done', () => {
    expect(calcStreak('h', done('2026-09-22', '2026-09-23'), daily)).toBe(2)
  })
  it('includes today when done', () => {
    expect(calcStreak('h', done('2026-09-23', '2026-09-24'), daily)).toBe(2)
  })
  it('skips rest days', () => {
    expect(calcStreak('h', done('2026-09-18', '2026-09-21', '2026-09-22', '2026-09-23'), weekdays)).toBe(4)
  })
})

describe('calcBestStreak', () => {
  it('breaks on a missed scheduled day', () => {
    expect(calcBestStreak('h', done('2026-09-01', '2026-09-03'), daily)).toBe(1)
  })
  it('counts consecutive days', () => {
    expect(calcBestStreak('h', done('2026-09-01', '2026-09-02', '2026-09-03', '2026-09-10'), daily)).toBe(3)
  })
  it('bridges rest days for weekday habits', () => {
    expect(calcBestStreak('h', done('2026-09-17', '2026-09-18', '2026-09-21'), weekdays)).toBe(3)
  })
  it('ignores unchecked entries', () => {
    expect(calcBestStreak('h', { h: { '2026-09-01': true, '2026-09-02': false } }, daily)).toBe(1)
  })
  it('returns 0 with no completions', () => {
    expect(calcBestStreak('h', {}, daily)).toBe(0)
  })
})

describe('reorderSubset', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
  const ids = l => l.map(x => x.id).join('')

  it('moves within the full list', () => {
    expect(ids(reorderSubset(list, ['a', 'b', 'c', 'd'], 'a', 'c'))).toBe('bcad')
  })
  it('keeps items outside the subset in place', () => {
    expect(ids(reorderSubset(list, ['a', 'c', 'd'], 'd', 'a'))).toBe('dbac')
  })
})
