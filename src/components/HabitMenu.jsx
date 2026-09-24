import { useState, useEffect, useRef } from 'react'

export default function HabitMenu({ name, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function close(e) {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  function pick(fn) {
    setOpen(false)
    fn()
  }

  return (
    <div className="menu" ref={ref}>
      <button className="menu-btn hit" aria-label={`Options for ${name}`} aria-haspopup="menu"
        aria-expanded={open} onClick={() => setOpen(o => !o)}>&#8943;</button>
      {open && (
        <div className="card menu-list" role="menu">
          <button role="menuitem" onClick={() => pick(onEdit)}>Edit</button>
          <button role="menuitem" className="danger" onClick={() => pick(onDelete)}>Delete</button>
        </div>
      )}
    </div>
  )
}
