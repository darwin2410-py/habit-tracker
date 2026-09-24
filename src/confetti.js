const COLORS = ['#C4653A', '#5B8C6F', '#D49B3A', '#4A90D9', '#E85D9E']

// Pieces are created in an event handler (not during render) so render stays pure
export function makeConfetti(count = 40) {
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.4,
    dur: 1.6 + Math.random() * 1.2,
    drift: (Math.random() - 0.5) * 160,
    spin: (Math.random() - 0.5) * 1080,
  }))
}
