import { useCallback } from 'react'
import { T } from '../theme'
import { getDayLabel, calcStreak, calcBestStreak, isScheduled } from '../utils'
import { useLongPress } from '../hooks/useLongPress'

export default function HabitCard({
  habit, idx, completions, today, last7,
  editingId, editName, setEditName,
  onToggle, onStartEdit, onRename, onCancelEdit, onDelete,
  category
}) {
  const streak = calcStreak(habit.id, completions, habit)
  const bestStreak = calcBestStreak(habit.id, completions, habit)
  const scheduled = isScheduled(habit, today)
  const done = completions[habit.id]?.[today]

  const longPress = useLongPress(
    useCallback(() => onStartEdit(habit.id, habit.name), [habit.id, habit.name, onStartEdit]),
    500
  )

  return (
    <div style={{
      background: T.card, borderRadius: T.radius, padding: '18px 20px', marginBottom: 14,
      boxShadow: T.shadow, transition: 'all 0.3s',
      animation: `fadeUp 0.5s ease ${0.08 + idx * 0.05}s both`,
      borderLeft: done ? `3px solid ${T.sage}` : `3px solid transparent`,
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadowHover}
      onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
<button onClick={() => scheduled && onToggle(habit.id, today)} style={{
            width: 26, height: 26, borderRadius: 7, border: '2px solid',
            borderColor: done ? T.sage : scheduled ? T.inkFaint : T.creamDark,
            background: done ? T.sage : 'transparent',
            color: done ? '#fff' : T.inkFaint, fontSize: 13, cursor: scheduled ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            transition: 'all 0.25s',
            animation: done ? 'checkPop 0.3s ease' : 'none',
            opacity: scheduled ? 1 : 0.4,
          }}
            onMouseEnter={e => { if (!done && scheduled) e.currentTarget.style.borderColor = T.sage }}
            onMouseLeave={e => { if (!done) e.currentTarget.style.borderColor = T.inkFaint }}
          >{done ? '\u2713' : ''}</button>

          {editingId === habit.id ? (
            <input value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onRename(habit.id); if (e.key === 'Escape') onCancelEdit() }}
              onBlur={() => onRename(habit.id)}
              autoFocus
              style={{
                fontWeight: 600, fontSize: 15, color: T.ink, border: 'none', outline: 'none',
                borderBottom: `1.5px solid ${T.accent}`, background: 'transparent',
                fontFamily: T.sans, padding: '0 0 2px', flex: 1, minWidth: 0,
              }}
            />
          ) : (
            <span
              onDoubleClick={() => onStartEdit(habit.id, habit.name)}
              {...longPress}
              title="Double-click or long-press to rename"
              style={{
                fontWeight: 600, fontSize: 15, color: done ? T.inkMuted : T.ink,
                textDecoration: done ? 'line-through' : 'none',
                textDecorationColor: T.inkFaint,
                transition: 'all 0.3s', cursor: 'text',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{habit.name}{!scheduled && (
                <span style={{
                  fontSize: 10, color: T.inkMuted, marginLeft: 6,
                  fontWeight: 400, fontStyle: 'italic', verticalAlign: 'middle',
                }}>Rest day</span>
              )}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
          {streak > 0 && (
            <span style={{
              fontSize: 12, background: T.amberLight, color: T.amber, borderRadius: 99,
              padding: '3px 10px', fontWeight: 700, letterSpacing: '-0.2px',
            }}>{streak}d</span>
          )}
          {bestStreak > 0 && bestStreak > streak && (
            <span style={{
              fontSize: 12, background: T.sageLight, color: T.sage, borderRadius: 99,
              padding: '3px 10px', fontWeight: 700, letterSpacing: '-0.2px',
            }} title="Best streak">{bestStreak}d best</span>
          )}
          {category && (
            <span style={{
              fontSize: 11, background: category.color + '20',
              color: category.color, borderRadius: 99,
              padding: '2px 8px', fontWeight: 600, letterSpacing: '-0.1px',
            }}>{category.name}</span>
          )}
          <button onClick={() => onStartEdit(habit.id, habit.name)} style={{
            background: 'none', border: 'none', color: T.inkFaint, cursor: 'pointer',
            fontSize: 14, padding: '2px 4px', transition: 'color 0.2s', lineHeight: 1,
          }}
            onMouseEnter={e => e.currentTarget.style.color = T.inkSoft}
            onMouseLeave={e => e.currentTarget.style.color = T.inkFaint}
            title="Rename"
          >&#9998;</button>
          <button onClick={onDelete} style={{
            background: 'none', border: 'none', color: T.inkFaint, cursor: 'pointer',
            fontSize: 18, padding: '0 2px', transition: 'color 0.2s', lineHeight: 1
          }}
            onMouseEnter={e => e.currentTarget.style.color = T.danger}
            onMouseLeave={e => e.currentTarget.style.color = T.inkFaint}
            title="Delete"
          >&times;</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
{last7.map(d => {
          const dayDone = completions[habit.id]?.[d]
          const isToday = d === today
          const dayScheduled = isScheduled(habit, d)
          const canToggle = dayScheduled
          return (
            <div key={d} style={{ flex: 1, textAlign: 'center', opacity: dayScheduled ? 1 : 0.3 }}>
              <div style={{
                fontSize: 10, color: isToday ? T.accent : T.inkMuted, marginBottom: 4,
                fontWeight: isToday ? 700 : 500
              }}>{getDayLabel(d)}</div>
              <div onClick={() => canToggle && onToggle(habit.id, d)} style={{
                width: '100%', aspectRatio: '1', borderRadius: 6,
                background: dayDone ? T.sage : canToggle ? T.cream : 'transparent',
                cursor: canToggle ? 'pointer' : 'default', transition: 'all 0.2s',
                border: isToday ? `1.5px solid ${T.accent}` : !canToggle ? `1px solid ${T.inkFaint}` : '1.5px solid transparent',
                animation: dayDone ? 'scaleIn 0.2s ease' : 'none',
              }}
                onMouseEnter={e => { if (!dayDone && canToggle) e.currentTarget.style.background = T.sageLight }}
                onMouseLeave={e => { if (!dayDone && canToggle) e.currentTarget.style.background = T.cream }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}