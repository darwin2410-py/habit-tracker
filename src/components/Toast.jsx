import { useEffect } from 'react'
import { T } from '../theme'

export default function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  const bg = type === 'error' ? T.dangerLight : T.sageLight
  const color = type === 'error' ? T.danger : T.sage

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: bg, color, border: `1.5px solid ${color}`,
      padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600,
      fontFamily: T.sans, zIndex: 999, animation: 'fadeUp 0.3s ease both',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxWidth: '90vw',
    }}>{message}</div>
  )
}