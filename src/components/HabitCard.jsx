import { useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getDayLabel, calcStreak, calcBestStreak, isScheduled, parseDateKey } from '../utils'
import { useLongPress } from '../hooks/useLongPress'
import FrequencyPicker from './FrequencyPicker'
import CategoryChips from './CategoryChips'
import HabitMenu from './HabitMenu'

export default function HabitCard({
  habit, idx, completions, today, last7, rest,
  editingId, editName, setEditName,
  editingFreq, setEditingFreq,
  editingCatId, setEditingCatId,
  categories,
  onToggle, onStartEdit, onRename, onCancelEdit, onDelete,
  category
}) {
  const streak = calcStreak(habit.id, completions, habit)
  const bestStreak = calcBestStreak(habit.id, completions, habit)
  const scheduled = isScheduled(habit, today)
  const done = completions[habit.id]?.[today]
  const isEditing = editingId === habit.id

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id, disabled: isEditing })

  // eslint-disable-next-line no-unused-vars
  const { wasLongPress, ...longPress } = useLongPress(
    useCallback(() => onStartEdit(habit.id, habit.name, habit.frequency, habit.category_id), [habit.id, habit.name, habit.frequency, habit.category_id, onStartEdit]),
    500
  )

  function startEdit() {
    onStartEdit(habit.id, habit.name, habit.frequency, habit.category_id)
  }

  function save() {
    if (!editName.trim()) { onCancelEdit(); return }
    onRename(habit.id)
  }

  return (
    <div ref={setNodeRef} className={`habit${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}>
      <div className={`card habit-card fade-up${done ? ' done' : ''}${isEditing ? ' editing' : ''}${rest && !isEditing ? ' rest' : ''}`}
        style={{ animationDelay: `${0.08 + idx * 0.05}s` }}>
        <div className="habit-top">
          <div className="habit-main">
            {!isEditing && (
              <button ref={setActivatorNodeRef} className="drag-handle hit" title="Drag to reorder"
                {...attributes} {...listeners} aria-label={`Reorder ${habit.name}`}>&#8942;&#8942;</button>
            )}
            <button className={`check hit${done ? ' done' : ''}`} disabled={!scheduled}
              aria-label={`Mark ${habit.name} done today`} aria-pressed={!!done}
              onClick={() => onToggle(habit.id, today)}>
              {done ? '✓' : ''}
            </button>

            {isEditing ? (
              <input className="habit-name-input" value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onRename(habit.id); if (e.key === 'Escape') onCancelEdit() }}
                autoFocus
              />
            ) : (
              <span className="habit-name" onDoubleClick={startEdit} {...longPress}
                title="Double-click or long-press to edit">
                {habit.name}
              </span>
            )}
          </div>

          <div className="habit-meta">
            {streak > 0 && <span className="badge streak">{'🔥'} {streak}d</span>}
            {bestStreak > streak && <span className="badge best" title="Best streak">{'🏆'} {bestStreak}d</span>}
            {!isEditing && category && (
              <span className="badge category" style={{ background: category.color + '20', color: category.color }}>
                {category.name}
              </span>
            )}
            {!isEditing && <HabitMenu name={habit.name} onEdit={startEdit} onDelete={onDelete} />}
          </div>
        </div>

        {isEditing && (
          <div className="edit-panel">
            <FrequencyPicker frequency={editingFreq || { type: 'daily' }} onChange={setEditingFreq} />
            <div style={{ marginTop: 8 }}>
              <CategoryChips categories={categories} selectedId={editingCatId} onChange={setEditingCatId} />
            </div>
            <div className="edit-actions">
              <button className="btn sage" onClick={save}>Save</button>
              <button className="btn muted" onClick={onCancelEdit}>Cancel</button>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="week">
            {last7.map(d => {
              const dayDone = completions[habit.id]?.[d]
              const isToday = d === today
              const dayScheduled = isScheduled(habit, d)
              return (
                <div key={d} className={`week-day${dayScheduled ? '' : ' off'}`}>
                  <div className={`week-label${isToday ? ' today' : ''}`}>{getDayLabel(d)}</div>
                  <button disabled={!dayScheduled} onClick={() => onToggle(habit.id, d)}
                    className={`week-cell${dayDone ? ' done' : ''}${isToday ? ' today' : ''}`}
                    aria-label={`${habit.name}, ${parseDateKey(d).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
                    aria-pressed={!!dayDone}>
                    {Number(d.slice(8))}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
