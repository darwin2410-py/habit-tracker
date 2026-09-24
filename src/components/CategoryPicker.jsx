import { useState } from 'react'
import CategoryChips from './CategoryChips'
import Chip from './Chip'

const COLORS = [
  { hex: '#5B8C6F', name: 'Sage' },
  { hex: '#D49B3A', name: 'Amber' },
  { hex: '#C4653A', name: 'Clay' },
  { hex: '#4A90D9', name: 'Blue' },
  { hex: '#8B5CF6', name: 'Violet' },
  { hex: '#E85D9E', name: 'Pink' },
]

export default function CategoryPicker({ categories, selectedId, onChange, onCreate, className = '' }) {
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0].hex)

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    onCreate(name, newColor)
    setNewName('')
    setShowNew(false)
  }

  return (
    <div className={`card panel ${className}`}>
      <CategoryChips categories={categories} selectedId={selectedId} onChange={onChange}>
        <Chip className="dashed" onClick={() => setShowNew(true)}>+ New</Chip>
      </CategoryChips>

      {showNew && (
        <div className="new-category">
          <div className="new-category-row">
            <input className="input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Category name"
              autoFocus
            />
            <button className="btn primary" onClick={handleCreate}>Add</button>
          </div>
          <div className="chip-row">
            {COLORS.map(c => (
              <button key={c.hex} title={c.name}
                className={`swatch${newColor === c.hex ? ' active' : ''}`}
                style={{ background: c.hex }}
                onClick={() => setNewColor(c.hex)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
