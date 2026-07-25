import { T } from '../theme'

const DAYS = [
  { v: 0, l: 'S' },
  { v: 1, l: 'M' },
  { v: 2, l: 'T' },
  { v: 3, l: 'W' },
  { v: 4, l: 'T' },
  { v: 5, l: 'F' },
  { v: 6, l: 'S' },
]

const OPTIONS = [
  { key: 'daily', label: 'Every day' },
  { key: 'weekdays', label: 'Weekdays' },
  { key: 'weekends', label: 'Weekends' },
  { key: 'custom', label: 'Custom' },
]

export default function FrequencyPicker({ frequency, onChange, style }) {
  const type = frequency?.type || 'daily'
  const days = frequency?.days || []

  function selectType(key) {
    if (key === 'weekdays') onChange({ type: key, days: [1, 2, 3, 4, 5] })
    else if (key === 'weekends') onChange({ type: key, days: [0, 6] })
    else onChange({ type: key, days: [] })
  }

  function toggleDay(day) {
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day].sort()
    onChange({ type: 'custom', days: next })
  }

  return (
    <div style={{
      background: T.card, borderRadius: T.radius, padding: 16,
      boxShadow: T.shadow, ...style,
    }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: type === 'custom' ? 12 : 0 }}>
        {OPTIONS.map(o => {
          const active = type === o.key
          return (
            <button key={o.key} onClick={() => selectType(o.key)} style={{
              padding: '6px 14px', borderRadius: 99, border: '1.5px solid',
              borderColor: active ? T.accent : T.creamDark,
              background: active ? T.accent : 'transparent',
              color: active ? '#fff' : T.inkSoft,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans,
              transition: 'all 0.2s',
            }}>{o.label}</button>
          )
        })}
      </div>
      {type === 'custom' && (
        <div style={{ display: 'flex', gap: 4 }}>
          {DAYS.map(d => {
            const active = days.includes(d.v)
            return (
              <button key={d.v} onClick={() => toggleDay(d.v)} style={{
                width: 34, height: 34, borderRadius: 8,
                border: '1.5px solid',
                borderColor: active ? T.accent : T.creamDark,
                background: active ? T.accent : 'transparent',
                color: active ? '#fff' : T.inkSoft,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans,
                transition: 'all 0.2s',
              }}>{d.l}</button>
            )
          })}
        </div>
      )}
    </div>
  )
}