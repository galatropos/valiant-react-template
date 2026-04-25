// animateScaleBlur:
// Secuencia: inicio → acción(opacity/blur) → pausa intermedia → regreso (inverso) → pausa final
// - opacity:   delta de opacidad (default 1)
// - blur:      delta de blur (default -100)
// - startMs:   delay inicial (ms) antes de la acción
// - actionMs:  duración (ms) de la acción
// - pauseMidMs:pausa (ms) entre acción y regreso
// - returnMs:  duración (ms) del regreso (aplica el inverso)
// - pauseMs:   pausa final (ms)
const animateScaleBlur = ({
    opacity = 1,
    blur = -100,
    startMs = 300,
    actionMs = 1000,
    pauseMidMs = 1000,
    returnMs = 1000,
    pauseMs = 2000,
  } = {}) => ([
    [{}, startMs],                          // ⏱️ inicio (sin cambios)
    [{ opacity, blur }, actionMs],          // ▶️ acción
    [{}, pauseMidMs],                       // ⏸️ pausa intermedia
    [{ opacity: -opacity, blur: -blur }, returnMs], // ◀️ regreso (inverso)
    [{}, pauseMs],                          // ⏹️ pausa final
  ]);
  
  export default animateScaleBlur;
  