// src/component/effects/blaze/BlazeCTAMiddle.jsx
import React from "react";

/**
 * Convierte un color en formato HEX (#RRGGBB) o RGB (rgb(r,g,b)) a RGBA.
 *
 * @param {string} c - Color de entrada en uno de estos formatos:
 *   - "#RRGGBB" (hexadecimal de 6 dígitos)
 *   - "rgb(r,g,b)" (función CSS con valores 0-255)
 * @param {number} a - Alpha en rango 0..1 (ej. 0.35). **Importante:** es decimal, no porcentaje.
 * @returns {string} Color en formato "rgba(r,g,b,a)".
 */
const hexadecimalToRgba = (c, a) => {
  // Si el color empieza con "#", asumimos formato hex
  if (typeof c === "string" && c.startsWith("#")) {
    // Soporte #RGB → #RRGGBB
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

  // Si es rgb(r,g,b) → rgba(r,g,b,a)
  if (typeof c === "string" && c.startsWith("rgb(")) {
    return c.replace(/^rgb\(([^)]+)\)$/, `rgba($1,${a})`);
  }

  // Fallback: blanco
  return `rgba(255,255,255,${a})`;
};

/**
 * BlazeCTAMiddle
 *
 * Igual idea que BlazeCTA, pero:
 * - Usa DOS destellos.
 * - Ambos comienzan en el CENTRO y se separan:
 *   - ::before → se mueve hacia la izquierda.
 *   - ::after  → se mueve hacia la derecha.
 *
 * Props:
 *   - classNameAssing: string (clase del div/botón)
 *   - color: color del destello (HEX o rgb) → default "#3300CF"
 *   - sweepDurationMs: cuánto tarda en separarse el brillo, en ms. Default: 3000
 *   - intervalMS: tiempo de pausa SIN brillo entre un ciclo y otro, en ms. Default: 0
 *   - totalDurationMs: cuánto tiempo total se ejecuta el efecto antes de parar. Default: infinito
 *   - delayMs: cuánto tarda en arrancar el primer destello, en ms. Default: 0
 */

const BlazeCTAMiddle = ({
  classNameAssing,
  color = "#3300CF",
  sweepDurationMs = 3000,
  totalDurationMs,
  delayMs = 0,
  intervalMS = 0,
}) => {
  if (!classNameAssing) return null;

  // Colores del destello usando tu función
  const c0 = hexadecimalToRgba(color, 0.0); // transparente
  const cSoft = hexadecimalToRgba(color, 0.22);
  const cStrong = hexadecimalToRgba(color, 0.85);

  // Normalizamos tiempos
  const safeSweepMs =
    typeof sweepDurationMs === "number" && sweepDurationMs > 0
      ? sweepDurationMs
      : 3000;

  const safeIntervalMs =
    typeof intervalMS === "number" && intervalMS > 0 ? intervalMS : 0;

  const hasInterval = safeIntervalMs > 0;

  // Duración de UN ciclo: brillo + pausa
  const cycleMs = hasInterval ? safeSweepMs + safeIntervalMs : safeSweepMs;
  const cycleSec = cycleMs / 1000;

  const delaySec =
    typeof delayMs === "number" && delayMs > 0 ? delayMs / 1000 : 0;

  // Easing: empieza rápido y termina lento (ease-out personalizado)
  const easing = "cubic-bezier(0.2, 0, 0.2, 1)";

  // Porcentaje donde termina el tramo visible (separación hasta los bordes)
  const visibleEndPct = hasInterval ? (safeSweepMs / cycleMs) * 100 : 100;
  const visibleEndPctStr = visibleEndPct.toFixed(2);

  // Keyframes para el rayo que sale hacia la DERECHA
  const sweepKeyframesRight = hasInterval
    ? `
      0% {
        background-position: 50% 0;
        opacity: 1;
      }
      ${visibleEndPctStr}% {
        background-position: 150% 0;
        opacity: 1;
      }
      100% {
        background-position: 150% 0;
        opacity: 0;   /* tramo de pausa: sin brillo */
      }
    `
    : `
      0% {
        background-position: 50% 0;
        opacity: 1;
      }
      100% {
        background-position: 150% 0;
        opacity: 1;
      }
    `;

  // Keyframes para el rayo que sale hacia la IZQUIERDA
  const sweepKeyframesLeft = hasInterval
    ? `
      0% {
        background-position: 50% 0;
        opacity: 1;
      }
      ${visibleEndPctStr}% {
        background-position: -50% 0;
        opacity: 1;
      }
      100% {
        background-position: -50% 0;
        opacity: 0;   /* tramo de pausa: sin brillo */
      }
    `
    : `
      0% {
        background-position: 50% 0;
        opacity: 1;
      }
      100% {
        background-position: -50% 0;
        opacity: 1;
      }
    `;

  // Cuántas veces se repite la animación en total
  let iterationCount = "infinite";
  if (typeof totalDurationMs === "number" && totalDurationMs > 0 && cycleMs > 0) {
    const approx = totalDurationMs / cycleMs;
    const count = Math.max(1, Math.round(approx));
    iterationCount = count;
  }

  return (
    <style>{`
      /* Contenedor base: preparamos para pseudo-elementos */
      .${classNameAssing} {
        position: relative;
        z-index: 0;
      }

      /* RAYO QUE SALE HACIA LA IZQUIERDA (usa ::before) */
      .${classNameAssing}::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        z-index: 1;

        background:
          linear-gradient(90deg,
            ${c0} 0%,
            ${c0} 45%,
            ${cSoft} 48%,
            ${cStrong} 50%,
            ${cSoft} 52%,
            ${c0} 55%,
            ${c0} 100%
          );
        background-size: 200% 100%;
        background-position: 50% 0; /* empieza CENTRADO */

        filter: blur(3px);
        mix-blend-mode: screen;
        opacity: 1;

        animation: blazeCTAMiddleLeft ${cycleSec}s ${easing} ${delaySec}s ${iterationCount};
      }

      /* RAYO QUE SALE HACIA LA DERECHA (usa ::after) */
      .${classNameAssing}::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        z-index: 1;

        background:
          linear-gradient(90deg,
            ${c0} 0%,
            ${c0} 45%,
            ${cSoft} 48%,
            ${cStrong} 50%,
            ${cSoft} 52%,
            ${c0} 55%,
            ${c0} 100%
          );
        background-size: 200% 100%;
        background-position: 50% 0; /* empieza CENTRADO */

        filter: blur(3px);
        mix-blend-mode: screen;
        opacity: 1;

        animation: blazeCTAMiddleRight ${cycleSec}s ${easing} ${delaySec}s ${iterationCount};
      }

      .${classNameAssing}:hover::before,
      .${classNameAssing}:focus-visible::before,
      .${classNameAssing}:hover::after,
      .${classNameAssing}:focus-visible::after {
        opacity: 1;
      }

      .${classNameAssing}:active::before,
      .${classNameAssing}:active::after {
        opacity: 0.8;
      }

      /* Animación para el rayo que va a la IZQUIERDA */
      @keyframes blazeCTAMiddleLeft {
        ${sweepKeyframesLeft}
      }

      /* Animación para el rayo que va a la DERECHA */
      @keyframes blazeCTAMiddleRight {
        ${sweepKeyframesRight}
      }

      @media (prefers-reduced-motion: reduce) {
        .${classNameAssing}::before,
        .${classNameAssing}::after {
          animation: none !important;
        }
      }
    `}</style>
  );
};

export default BlazeCTAMiddle;
