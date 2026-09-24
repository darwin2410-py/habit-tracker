import Chip from './Chip'

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

export default function FrequencyPicker({ frequency, onChange, className = '' }) {
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
    <div className={`card panel ${className}`}>
      <div className="chip-row">
        {OPTIONS.map(o => (
          <Chip key={o.key} active={type === o.key} onClick={() => selectType(o.key)}>{o.label}</Chip>
        ))}
      </div>
      {type === 'custom' && (
        <div className="freq-days">
          {DAYS.map(d => (
            <Chip key={d.v} className="day-btn" active={days.includes(d.v)} onClick={() => toggleDay(d.v)}>{d.l}</Chip>
          ))}
        </div>
      )}
    </div>
  )
}
