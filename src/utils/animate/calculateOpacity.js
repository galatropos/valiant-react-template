// opacityUtils.js
export function calculateOpacity({ start = 1, end = 1, progress = 0 }) {
    // Devuelve la opacidad interpolada según el progreso (0 a 1)
    return start + (end - start) * progress;
  }