// 🎛️ Config por defecto como objeto
export const PULSE_MIRROR_DEFAULTS = {
    intensity: 0.09,     // cuánto sube/baja en cada pico (+9% / -9%)
    time: 1,             // factor de tiempo (2 = el doble de lento)
  
    // duraciones base (en ms) de TU array original
    d0: 500,             // [{ scale: 0 },      500]
    d1: 300,             // [{ scale: +intensity }, 300]
    d2: 300,             // [{ scale: 0 },      500]
    d3: 500,             // [{ scale: -intensity }, 500]
  
    // 🕒 pausa al final del ciclo antes de que tu motor lo repita
    loopPause: 2000,     // ms de espera con la escala tal como quedó
  
    // ⏰ inicio programado (igual que en animateHeartbeat)
    startAt: null,       // "19:05" | ISO "2025-10-24T19:05:00" | Date | timestamp
    startDelayMs: 0      // retraso relativo en ms (se suma si también hay startAt)
  };
  
  // ✅ Misma lógica que animateHeartbeat, pero con tu patrón + pausa final
  export default function animateScale(config = {}) {
    const {
      intensity,
      time,
      d0,
      d1,
      d2,
      d3,
      loopPause,
      startAt,
      startDelayMs,
    } = { ...PULSE_MIRROR_DEFAULTS, ...config };
  
    const clampMs = (n) => Math.max(0, Number.isFinite(n) ? n : 0);
  
    const getDelayFromStart = (startAt) => {
      if (!startAt) return 0;
      const now = new Date();
  
      // Caso "HH:mm"
      if (typeof startAt === "string" && /^\d{1,2}:\d{2}$/.test(startAt)) {
        const [h, m] = startAt.split(":").map(Number);
        const target = new Date(now);
        target.setHours(h, m, 0, 0);
        // si ya pasó hoy, se programa para mañana
        if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
        return Math.max(0, target.getTime() - now.getTime());
      }
  
      // Date | timestamp | ISO string
      const t =
        startAt instanceof Date ? startAt.getTime()
        : typeof startAt === "number" ? startAt
        : Date.parse(startAt);
  
      return Number.isFinite(t) ? Math.max(0, t - now.getTime()) : 0;
    };
  
    const startDelay = clampMs(getDelayFromStart(startAt) + startDelayMs);
  
    // ⏱️ Escalamos las duraciones por el factor de tiempo
    const dd0 = clampMs(d0 * time);
    const dd1 = clampMs(d1 * time);
    const dd2 = clampMs(d2 * time);
    const dd3 = clampMs(d3 * time);
    const dLoopPause = clampMs(loopPause * time);
  
    const seq = [];
  
    // Espera inicial opcional (NO cambia escala)
    if (startDelay > 0) seq.push([{}, startDelay]);
  
    // 👇 Aquí va EXACTAMENTE tu patrón original, pero configurable
    // const animate = [
    //   [{ scale: 0 },      500],
    //   [{ scale: 0.09 },   300],
    //   [{ scale: 0 },      500],
    //   [{ scale: -0.09 },  500],
    // ];
    seq.push(
      [{ scale: 0 },          dd0],
      [{ scale: +intensity }, dd1],
      [{ scale: 0 },          dd2],
      [{ scale: -intensity }, dd3],
    );
  
    // 🕒 Pausa al final del ciclo (sin cambiar escala)
    if (dLoopPause > 0) {
      seq.push([{}, dLoopPause]);
    }
  
    return seq;
  }
  