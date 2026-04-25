// src/component/effects/blaze/BlazeCTA.jsx
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
 * BlazeCTA
 *
 * - NO usa children.
 * - Solo inyecta CSS global para la clase que le pases.
 *
 * Props:
 *   - classNameAssing: string (clase del div/botón)
 *   - color: color del destello (HEX o rgb) → default "#3300CF"
 *   - sweepDurationMs: cuánto tarda en cruzar el brillo (por ciclo visible), en ms. Default: 3000
 *   - intervalMS: CUÁNTO TIEMPO ESTÁ SIN BRILLO entre un destello y el siguiente, en ms. Default: 0
 *   - totalDurationMs: cuánto tiempo total se ejecuta el efecto antes de parar. Default: infinito
 *   - delayMs: cuánto tarda en arrancar el primer destello, en ms. Default: 0
 */

const BlazeCTA = ({
  classNameAssing,
  color = "#3300CF",
  sweepDurationMs = 3000,
  totalDurationMs,
  delayMs = 0,
  intervalMS = 0,
}) => {
  if (!classNameAssing) return null;

  // Colores del destello usando TU función
  const c0 = hexadecimalToRgba(color, 0.0);   // transparente
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

  // Porcentaje donde termina el barrido visible
  const visibleEndPct = hasInterval ? (safeSweepMs / cycleMs) * 100 : 100;
  const visibleEndPctStr = visibleEndPct.toFixed(2);

  // Keyframes del destello (con o sin intervalo)
  const sweepKeyframes = hasInterval
    ? `
      0% {
        background-position: -70% 0;
        opacity: 1;
      }
      ${visibleEndPctStr}% {
        background-position: 170% 0;
        opacity: 1;
      }
      100% {
        background-position: 170% 0;
        opacity: 0;   /* tramo de pausa: sin brillo */
      }
    `
    : `
      0% {
        background-position: -70% 0;
      }
      100% {
        background-position: 170% 0;
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
      /* Contenedor base: solo preparamos para pseudo-elementos */
      .${classNameAssing} {
        position: relative;
        z-index: 0;
      }

      /* HALO EXTERIOR (lo dejamos transparente para no manchar el color) */
      .${classNameAssing}::before {
        content: "";
        position: absolute;
        inset: -8px;
        border-radius: inherit;
        pointer-events: none;
        z-index: -1;

        background:
          radial-gradient(ellipse at center,
            rgba(0,0,0,0.0) 0%,
            rgba(0,0,0,0.0) 55%,
            rgba(0,0,0,0.0) 80%,
            transparent 100%
          );
        filter: blur(12px);
        opacity: 0;

        /* Lo dejamos sincronizado con el ciclo, pero prácticamente invisible */
        animation: blazeCTAPulse ${cycleSec}s ease-in-out ${delaySec}s ${iterationCount};
      }

      /* DESTELLO ANGOSTO QUE CRUZA CON TU COLOR */
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
            ${c0} 42%,
            ${cSoft} 47%,
            ${cStrong} 50%,
            ${cSoft} 53%,
            ${c0} 58%,
            ${c0} 100%
          );
        background-size: 250% 100%;
        background-position: -70% 0;

        filter: blur(3px);
        mix-blend-mode: screen;
        opacity: 1;

        animation: blazeCTASweep ${cycleSec}s linear ${delaySec}s ${iterationCount};
      }

      .${classNameAssing}:hover::after,
      .${classNameAssing}:focus-visible::after {
        opacity: 1;
      }

      .${classNameAssing}:active::after {
        opacity: 0.8;
      }

      /* Animación del halo (ahora mismo invisible, pero sincronizada) */
      @keyframes blazeCTAPulse {
        0%, 100% {
          opacity: 0;
          filter: blur(11px);
        }
        50% {
          opacity: 0;
          filter: blur(15px);
        }
      }

      /* Destello que cruza de izquierda a derecha,
         y opcionalmente se apaga en el tramo de intervalo */
      @keyframes blazeCTASweep {
        ${sweepKeyframes}
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

export default BlazeCTA;
