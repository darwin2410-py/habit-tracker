import { useEffect } from 'react'

export default function Confetti({ pieces, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i key={i} style={{
          left: `${p.left}%`, background: p.color,
          '--delay': `${p.delay}s`, '--dur': `${p.dur}s`,
          '--drift': `${p.drift}px`, '--spin': `${p.spin}deg`,
        }} />
      ))}
    </div>
  )
}
