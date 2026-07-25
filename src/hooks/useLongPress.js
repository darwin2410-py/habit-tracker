import { useRef, useCallback } from 'react'

export function useLongPress(callback, delay = 500) {
  const timerRef = useRef(null)
  const triggeredRef = useRef(false)

  const start = useCallback((e) => {
    triggeredRef.current = false
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true
      callback(e)
    }, delay)
  }, [callback, delay])

  const clear = useCallback(() => {
    clearTimeout(timerRef.current)
  }, [])

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    wasLongPress: () => triggeredRef.current,
  }
}