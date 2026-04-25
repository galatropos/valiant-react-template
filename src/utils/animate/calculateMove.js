export function calculateMoveIncrement({ total, time, delta }) {
  if (!time || time <= 0) return 0;
  return (total / time) * delta;
}
