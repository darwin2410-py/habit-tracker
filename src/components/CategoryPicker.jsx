import { useState } from 'react'
import { T } from '../theme'

const COLORS = [
  { hex: '#5B8C6F', name: 'Sage' },
  { hex: '#D49B3A', name: 'Amber' },
  { hex: '#C4653A', name: 'Clay' },
  { hex: '#4A90D9', name: 'Blue' },
  { hex: '#8B5CF6', name: 'Violet' },
  { hex: '#E85D9E', name: 'Pink' },
]

export default function CategoryPicker({ categories, selectedId, onChange, onCreate, style }) {
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
    <div style={{
      background: T.card, borderRadius: T.radius, padding: 14,
      boxShadow: T.shadow, ...style,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button onClick={() => onChange(null)} style={{
          padding: '5px 12px', borderRadius: 99, border: '1.5px solid',
          borderColor: !selectedId ? T.accent : T.creamDark,
          background: !selectedId ? T.accent : 'transparent',
          color: !selectedId ? '#fff' : T.inkSoft,
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans,
          transition: 'all 0.2s',
        }}>None</button>
        {categories.map(c => {
          const active = selectedId === c.id
          return (
            <button key={c.id} onClick={() => onChange(c.id)} style={{
              padding: '5px 12px 5px 8px', borderRadius: 99, border: '1.5px solid',
              borderColor: active ? c.color : T.creamDark,
              background: active ? c.color : 'transparent',
              color: active ? '#fff' : T.inkSoft,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans,
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: active ? '#fff' : c.color,
                display: 'inline-block',
              }} />
              {c.name}
            </button>
          )
        })}
        <button onClick={() => setShowNew(true)} style={{
          padding: '5px 10px', borderRadius: 99, border: '1.5px dashed',
          borderColor: T.inkFaint, background: 'transparent',
          color: T.inkMuted, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          fontFamily: T.sans, transition: 'all 0.2s',
        }}>+ New</button>
      </div>

      {showNew && (
        <div style={{ marginTop: 12, animation: 'fadeUp 0.2s ease both' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Category name"
              autoFocus
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8,
                border: `1.5px solid ${T.creamDark}`, fontSize: 13,
                background: T.card, color: T.ink, outline: 'none',
                fontFamily: T.sans, fontWeight: 500,
              }}
            />
            <button onClick={handleCreate} style={{
              background: T.accent, color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 14px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', fontFamily: T.sans,
            }}>Add</button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {COLORS.map(c => (
              <button key={c.hex} onClick={() => setNewColor(c.hex)}
                title={c.name}
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: c.hex, border: newColor === c.hex ? `2.5px solid ${T.ink}` : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}