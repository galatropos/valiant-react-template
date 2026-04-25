// src/component/effects/blaze/BlazeCTAPulse.jsx
import React from "react";

/**
 * Convierte HEX (#RRGGBB / #RGB) o RGB (rgb(r,g,b)) a RGBA.
 */
const hexadecimalToRgba = (c, a) => {
  if (typeof c === "string" && c.startsWith("#")) {
    if (c.length === 4) {
      const r = c[1];
      const g = c[2];
      const b = c[3];
      c = `#${r}${r}${g}${g}${b}${b}`;
    }
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  if (typeof c === "string" && c.startsWith("rgb(")) {
    return c.replace(/^rgb\(([^)]+)\)$/, `rgba($1,${a})`);
  }

  return `rgba(255,255,255,${a})`;
};

/**
 * BlazeCTAPulse
 *
 * Efecto "pulse" para CTA (ej: Descargar ahora).
 * - Pulso suave de "aura" alrededor + leve escala del botón.
 * - Con pausa opcional entre pulsos.
 *
 * Props:
 *   - classNameAssing: string (clase del botón/div)
 *   - color: color del pulso (HEX o rgb) → default "#3300CF"
 *   - pulseDurationMs: duración del pulso (crecer→volver) en ms. Default: 900
 *   - intervalMS: pausa sin pulso entre ciclos en ms. Default: 900
 *   - totalDurationMs: tiempo total ejecutándose antes de parar. Default: infinito
 *   - delayMs: delay antes del primer pulso. Default: 0
 *   - scaleTo: escala máxima del botón durante el pulso. Default: 1.035
 */
const BlazeCTAPulse = ({
  classNameAssing,
  color = "#3300CF",
  pulseDurationMs = 900,
  intervalMS = 900,
  totalDurationMs,
  delayMs = 0,
  scaleTo = 1.035,
}) => {
  if (!classNameAssing) return null;

  // Colores (aura / ring)
  const c0 = hexadecimalToRgba(color, 0.0);
  const cSoft = hexadecimalToRgba(color, 0.20);
  const cMid = hexadecimalToRgba(color, 0.35);
  const cStrong = hexadecimalToRgba(color, 0.65);

  const safePulseMs =
    typeof pulseDurationMs === "number" && pulseDurationMs > 0
      ? pulseDurationMs
      : 900;

  const safeIntervalMs =
    typeof intervalMS === "number" && intervalMS > 0 ? intervalMS : 0;

  const hasInterval = safeIntervalMs > 0;

  const cycleMs = safePulseMs + safeIntervalMs;
  const cycleSec = cycleMs / 1000;

  const delaySec =
    typeof delayMs === "number" && delayMs > 0 ? delayMs / 1000 : 0;

  // Easing (suave)
  const easing = "cubic-bezier(0.2, 0, 0.2, 1)";

  // Porcentaje donde termina el pulso y empieza la pausa
  const visibleEndPct = hasInterval ? (safePulseMs / cycleMs) * 100 : 100;
  const visibleEndPctStr = visibleEndPct.toFixed(2);

  // Iteraciones aproximadas
  let iterationCount = "infinite";
  if (
    typeof totalDurationMs === "number" &&
    totalDurationMs > 0 &&
    cycleMs > 0
  ) {
    const approx = totalDurationMs / cycleMs;
    const count = Math.max(1, Math.round(approx));
    iterationCount = count;
  }

  // Keyframes del aura/ring (pseudo-elemento)
  const pulseAuraKeyframes = hasInterval
    ? `
      0% {
        opacity: 0;
        transform: scale(0.92);
        filter: blur(6px);
      }
      22% {
        opacity: 1;
      }
      55% {
        opacity: 1;
        transform: scale(1.18);
        filter: blur(10px);
      }
      ${visibleEndPctStr}% {
        opacity: 0;
        transform: scale(1.26);
        filter: blur(12px);
      }
      100% {
        opacity: 0; /* pausa */
        transform: scale(1.26);
        filter: blur(12px);
      }
    `
    : `
      0% {
        opacity: 0;
        transform: scale(0.92);
        filter: blur(6px);
      }
      22% { opacity: 1; }
      60% {
        opacity: 1;
        transform: scale(1.18);
        filter: blur(10px);
      }
      100% {
        opacity: 0;
        transform: scale(1.26);
        filter: blur(12px);
      }
    `;

  // Keyframes de escala del botón (muy leve)
  const pulseScaleKeyframes = hasInterval
    ? `
      0% { transform: scale(1); }
      30% { transform: scale(${scaleTo}); }
      60% { transform: scale(1); }
      ${visibleEndPctStr}% { transform: scale(1); }
      100% { transform: scale(1); } /* pausa */
    `
    : `
      0% { transform: scale(1); }
      35% { transform: scale(${scaleTo}); }
      70% { transform: scale(1); }
      100% { transform: scale(1); }
    `;

  return (
    <style>{`
      .${classNameAssing}{
        position: relative;
        z-index: 0;
        transform: translateZ(0); /* ayuda a que se vea suave */
        will-change: transform;
        animation: blazeCTAPulseScale ${cycleSec}s ${easing} ${delaySec}s ${iterationCount};
      }

      /* Aura / ring exterior */
      .${classNameAssing}::after{
        content:"";
        position:absolute;
        inset:-10px;              /* el halo sale un poquito del botón */
        border-radius: inherit;
        pointer-events:none;
        z-index:-1;

        /* ring + glow suave */
        background:
          radial-gradient(closest-side,
            ${cStrong} 0%,
            ${cMid} 35%,
            ${cSoft} 55%,
            ${c0} 75%,
            ${c0} 100%
          );
        opacity: 0;
        transform: scale(0.92);
        filter: blur(6px);

        mix-blend-mode: screen;

        animation: blazeCTAPulseAura ${cycleSec}s ${easing} ${delaySec}s ${iterationCount};
      }

      /* Mantener visible al hover/focus (sin “apagarse” en pausa) */
      .${classNameAssing}:hover::after,
      .${classNameAssing}:focus-visible::after{
        opacity: 1;
      }

      /* Click: un poquito menos */
      .${classNameAssing}:active{
        transform: scale(0.985);
      }
      .${classNameAssing}:active::after{
        opacity: 0.75;
      }

      @keyframes blazeCTAPulseAura{
        ${pulseAuraKeyframes}
      }

      @keyframes blazeCTAPulseScale{
        ${pulseScaleKeyframes}
      }

      @media (prefers-reduced-motion: reduce){
        .${classNameAssing}{
          animation:none !important;
        }
        .${classNameAssing}::after{
          animation:none !important;
          opacity: 0 !important;
        }
      }
    `}</style>
  );
};

export default BlazeCTAPulse;
