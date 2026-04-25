// 🎛️ Config por defecto como objeto
export const PENDULUM_DEFAULTS = {
  ampRotate: 2,     // amplitud inicial de giro (deg)
  ampX: 2,          // amplitud inicial en X (px o delta pequeño si tu motor lo soporta)
  swings: 4,        // número de oscilaciones (pares izq/der)
  decay: 0.85,      // atenuación por oscilación (0.85 = 85% de la anterior)
  stepMs: 110,      // duración base de cada semioscilación (ms)
  wobble: 1.05,     // asimetría izq/der (>1: “derecha” un poco más lenta)
  settleMs: 1600,   // descanso final (ms) en posición neutra
  pause: 0,         // reposo intermedio inicial (ms) SIN cambio de transform
  time: 1,          // factor de tiempo (2 = el doble de lento)
  startAt: null,    // "19:05" | ISO "2025-10-24T19:05:00" | Date | timestamp
  startDelayMs: 0,  // retraso relativo en ms (se suma si también hay startAt)
  emitX: true       // ⟵ NUEVO: si false, no emite 'x' en la secuencia
};

// ✅ Misma lógica pero con objeto de entrada
export default function animatePendule(config = {}) {
  const {
    ampRotate,
    ampX,
    swings,
    decay,
    stepMs,
    wobble,
    settleMs,
    pause,
    time,
    startAt,
    startDelayMs,
    emitX
  } = { ...PENDULUM_DEFAULTS, ...config };

  const clampMs = (n) => Math.max(0, Number.isFinite(n) ? n : 0);

  // Calcula delay relativo hasta un instante "startAt"
  const getDelayFromStart = (startAt) => {
    if (!startAt) return 0;
    const now = new Date();

    // Caso "HH:MM" local (si ya pasó hoy, programa mañana)
    if (typeof startAt === "string" && /^\d{1,2}:\d{2}$/.test(startAt)) {
      const [h, m] = startAt.split(":").map(Number);
      const target = new Date(now);
      target.setHours(h, m, 0, 0);
      if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
      return Math.max(0, target.getTime() - now.getTime());
    }

    // ISO / Date / timestamp
    const t =
      startAt instanceof Date ? startAt.getTime()
      : typeof startAt === "number" ? startAt
      : Date.parse(startAt);

    return Number.isFinite(t) ? Math.max(0, t - now.getTime()) : 0;
  };

  const startDelay = clampMs(getDelayFromStart(startAt) + startDelayMs);

  // Duraciones ajustadas
  const stepLeft  = clampMs(stepMs * time);          // izquierda
  const stepRight = clampMs(stepMs * wobble * time); // derecha
  const dPause    = clampMs(pause * time);
  const dSettle   = clampMs(settleMs * time);

  const seq = [];

  // Espera inicial programada
  if (startDelay > 0) seq.push([{}, startDelay]);

  // Pausa opcional antes de iniciar oscilación
  if (dPause > 0) seq.push([{}, dPause]);

  // Construye oscilaciones alternando signos (+ / -)
  // Formato: [ [{ rotate: ±X, x?: ±Y }, duraciónMs], ... ]
  let rot = ampRotate;
  let dx  = ampX;

  for (let i = 0; i < swings; i++) {
    const signLeft  = (i % 2 === 0) ? +1 : -1;
    const signRight = -signLeft;

    // Semioscilación 1 (lado A)
    seq.push([
      emitX
        ? { rotate: signLeft * rot, x: signLeft * dx }
        : { rotate: signLeft * rot },
      stepLeft
    ]);

    // Semioscilación 2 (lado B)
    seq.push([
      emitX
        ? { rotate: signRight * rot, x: signRight * dx }
        : { rotate: signRight * rot },
      stepRight
    ]);

    // Atenuación
    rot *= decay;
    dx  *= decay;
  }

  // Descanso/settle final en neutro de ROTACIÓN.
  // ⚠️ Importante: NO tocar 'x' aquí para no pisar la posición base.
  seq.push([{ rotate: 0 }, dSettle]);

  return seq;
}

/* ===========================
 * Ejemplos de uso
 * ===========================
 *
 * 1) Rotación solamente:
 *    animatePendule({ ampX: 0, emitX: false });
 *
 * 2) Rotación + leve X (si tu motor acepta 'x' como delta segura):
 *    animatePendule({ ampRotate: 3, ampX: 1, swings: 4, decay: 0.9, emitX: true });
 */
