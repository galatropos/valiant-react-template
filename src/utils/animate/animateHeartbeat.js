// 🎛️ Config por defecto como objeto
export const HEARTBEAT_DEFAULTS = {
  intensity: 0.06,     // fuerza del primer pico (+6%)
  rest: 260,           // descanso final (ms)
  time: 1,             // factor de tiempo (2 = el doble de lento)
  pause: 1000,         // reposo intermedio (ms) SIN cambio de escala
  startAt: null,       // "19:05" | ISO "2025-10-24T19:05:00" | Date | timestamp
  startDelayMs: 0      // retraso relativo en ms (se suma si también hay startAt)
};

// ✅ Misma lógica pero con objeto de entrada
export default function animateHeartbeat(config = {}) {
  const {
    intensity,
    rest,
    time,
    pause,
    startAt,
    startDelayMs
  } = { ...HEARTBEAT_DEFAULTS, ...config };

  const clampMs = (n) => Math.max(0, Number.isFinite(n) ? n : 0);

  const getDelayFromStart = (startAt) => {
    if (!startAt) return 0;
    const now = new Date();

    if (typeof startAt === "string" && /^\d{1,2}:\d{2}$/.test(startAt)) {
      const [h, m] = startAt.split(":").map(Number);
      const target = new Date(now);
      target.setHours(h, m, 0, 0);
      if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
      return Math.max(0, target.getTime() - now.getTime());
    }

    const t =
      startAt instanceof Date ? startAt.getTime()
      : typeof startAt === "number" ? startAt
      : Date.parse(startAt);

    return Number.isFinite(t) ? Math.max(0, t - now.getTime()) : 0;
  };

  const startDelay = clampMs(getDelayFromStart(startAt) + startDelayMs);

  const d1 = clampMs(90 * time);
  const d2 = clampMs(120 * time);
  const d3 = clampMs(80 * time);
  const dPause = clampMs(pause * time);
  const dRest = clampMs(rest * time);

  const seq = [];
  if (startDelay > 0) seq.push([{}, startDelay]); // espera inicial
  if (dPause > 0) seq.push([{}, dPause]);         // reposo intermedio

  // Latido
  seq.push(
    [{ scale: +intensity }, d1],
    [{ scale: -intensity * 0.25 }, d2],
    [{ scale: +intensity * 0.5 }, d3]
  );

  // Cierre balanceado (vuelve a 0)
  const sum = intensity - intensity * 0.25 + intensity * 0.5; // 1.25 * intensity
  seq.push([{ scale: -sum }, dRest]);

  return seq;
}
