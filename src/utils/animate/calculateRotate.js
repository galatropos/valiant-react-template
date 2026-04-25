export function calculateRotateX({ start = 0, end = 0, progress = 0 }) {
    console.log(progress)
    // Devuelve la rotación X acumulativa según progreso
    return start + end * progress;
  }
  
  export function calculateRotateY({ start = 0, end = 0, progress = 0 }) {
    // Devuelve la rotación Y acumulativa según progreso
    return start + end * progress;
  }

  export function calculateRotateIncrement({ total = 0, time = 1000, delta = 0 }) {
    // Incremento acumulativo frame a frame
    return (total / time) * delta;
  }