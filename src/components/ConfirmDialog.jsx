import { T } from '../theme'

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: T.overlay, zIndex: 998,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fadeUp 0.2s ease both',
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.card, borderRadius: T.radius + 4, padding: '28px 24px',
        maxWidth: 340, width: '100%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)', animation: 'scaleIn 0.25s ease both',
      }}>
        <h3 style={{
          fontFamily: T.serif, fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 8
        }}>{title}</h3>
        <p style={{
          fontSize: 14, color: T.inkSoft, lineHeight: 1.5, marginBottom: 24, fontFamily: T.sans
        }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            background: T.cream, border: 'none', borderRadius: 10, padding: '9px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', color: T.inkSoft,
            fontFamily: T.sans, transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = T.creamDark}
            onMouseLeave={e => e.currentTarget.style.background = T.cream}
          >Cancel</button>
          <button onClick={onConfirm} style={{
            background: T.danger, border: 'none', borderRadius: 10, padding: '9px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff',
            fontFamily: T.sans, transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >Delete</button>
        </div>
      </div>
    </div>
  )
}