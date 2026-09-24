import { useEffect } from 'react'

export default function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return <div className={`toast${type === 'error' ? ' error' : ''}`}>{message}</div>
}
