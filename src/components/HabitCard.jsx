import { useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getDayLabel, calcStreak, calcBestStreak, isScheduled } from '../utils'
import { useLongPress } from '../hooks/useLongPress'
import FrequencyPicker from './FrequencyPicker'
import CategoryChips from './CategoryChips'

export default function HabitCard({
  habit, idx, completions, today, last7,
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

  const longPress = useLongPress(
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
      <div className={`card habit-card fade-up${done ? ' done' : ''}${isEditing ? ' editing' : ''}`}
        style={{ animationDelay: `${0.08 + idx * 0.05}s` }}>
        <div className="habit-top">
          <div className="habit-main">
            {!isEditing && (
              <button ref={setActivatorNodeRef} className="drag-handle" title="Drag to reorder"
                {...attributes} {...listeners}>&#8942;&#8942;</button>
            )}
            <button className={`check${done ? ' done' : ''}`} disabled={!scheduled}
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
                title="Double-click or long-press to rename">
                {habit.name}
                {!scheduled && <span className="rest-tag">Rest day</span>}
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
            <button className="btn-ghost" style={{ fontSize: 14, padding: '2px 4px' }} onClick={startEdit} title="Rename">&#9998;</button>
            <button className="btn-ghost danger" style={{ fontSize: 18, padding: '0 2px' }} onClick={onDelete} title="Delete">&times;</button>
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
                    className={`week-cell${dayDone ? ' done' : ''}${isToday ? ' today' : ''}`} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
