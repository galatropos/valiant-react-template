// animateBlurCombo:
// Secuencia: inicio → acción (opacity/blur/backdropBlur) → pausa intermedia → regreso (inverso) → pausa final
// Parámetros:
// - opacity:        delta de opacidad (default 1)
// - blur:           delta de blur (default 100)
// - backdropBlur:   delta de backdropBlur (default 100)
// - startMs:        delay inicial (ms) antes de la acción
// - actionMs:       duración (ms) de la acción
// - pauseMidMs:     pausa (ms) entre acción y regreso
// - returnMs:       duración (ms) del regreso (inverso)
// - pauseMs:        pausa final (ms)
export default function animateBlurCombo({
    opacity = 1,
    blur = 100,
    backdropBlur = 100,
    startMs = 0,
    actionMs = 200,
    pauseMidMs = 100,
    returnMs = 200,
    pauseMs = 1000,
  } = {}) {
    // Construimos objetos sólo con las propiedades definidas
    const action = {};
    if (opacity != null) action.opacity = opacity;
    if (blur != null) action.blur = blur;
    if (backdropBlur != null) action.backdropBlur = backdropBlur;
  
    const inverse = {};
    if (opacity != null) inverse.opacity = -opacity;
    if (blur != null) inverse.blur = -blur;
    if (backdropBlur != null) inverse.backdropBlur = -backdropBlur;
  
    return [
      [{}, startMs],             // ⏱️ inicio (sin cambios)
      [action, actionMs],        // ▶️ acción
      [{}, pauseMidMs],          // ⏸️ pausa intermedia
      [inverse, returnMs],       // ◀️ regreso (inverso)
      [{}, pauseMs],             // ⏹️ pausa final
    ];
  }
  