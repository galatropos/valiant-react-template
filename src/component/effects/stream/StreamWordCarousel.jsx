// StreamWordCarousel.jsx
import React from "react";
import Card from "../../Card";

// Cada "peldaño" vertical (45 height + 45 margin-bottom)
const STEP_PX = 90;

// Duraciones base para las animaciones (se usan en creationKeyFrames)
const BASE_DURATION = 4;
const STEP_DURATION = 2;

// La de antes, la dejo igual (no se usa aquí, pero no la borro)
function creationKeyFrames(maxFlips) {
  let css = "";

  for (let i = 0; i < maxFlips; i++) {
    const flipNumber = i + 2; // 0→flip2, 1→flip3, etc.
    const words = flipNumber;
    const topOffset = -STEP_PX * words;

    css += `@keyframes flip${flipNumber} {\n`;

    const totalSteps = words + 1;
    for (let step = 0; step <= totalSteps; step++) {
      const percent = (step / totalSteps) * 100;
      const y = topOffset + STEP_PX * step;
      css += `  ${percent.toFixed(2)}% { margin-top: ${y}px; }\n`;
    }

    css += `  100% { margin-top: ${topOffset}px; }\n`;
    css += `}\n\n`;

    const durationSeconds = BASE_DURATION + STEP_DURATION * i;
    css += `.flip${flipNumber} {\n`;
    css += `  animation: flip${flipNumber} var(--stream-carousel-duration, ${durationSeconds}s)\n`;
    css += `    cubic-bezier(0.23, 1, 0.32, 1.2) infinite;\n`;
    css += `}\n\n`;
  }

  return css;
}

/**
 * Animación dinámica para count > 5.
 * Mantiene el patrón: salto → pausa, y el último respeta 99.99% / 100%.
 */
function createExtraFlipLarge(count, stepPx, usedDuration) {
  if (count <= 5) return "";

  const words = count; // tratamos count como número de palabras
  const startY = -stepPx * words; // posición inicial arriba de todo
  const block = 100 / words; // cada transición ocupa un bloque del timeline
  const jumpRatio = 0.2; // 20% del bloque para el salto

  let css = `@keyframes flipDynamic {\n`;

  // posición inicial
  css += `  0% { margin-top: ${startY}px; }\n`;

  // Tenemos 'words' transiciones: y0 -> y1 -> ... -> yWords (0)
  // y_j = -stepPx * (words - j)
  for (let j = 0; j < words; j++) {
    const base = j * block;
    const jumpPercent = base + block * jumpRatio;
    const holdEndPercent = (j + 1) * block;

    const y = -stepPx * (words - (j + 1)); // siguiente peldaño

    // Keyframe de llegada
    css += `  ${jumpPercent.toFixed(2)}% { margin-top: ${y}px; }\n`;

    // Para todos menos el último, la pausa llega hasta el fin del bloque.
    // Para el último, usamos 99.99 para conservar el truco de salto en 100%.
    if (j < words - 1) {
      css += `  ${holdEndPercent.toFixed(2)}% { margin-top: ${y}px; }\n`;
    } else {
      css += `  99.99% { margin-top: ${y}px; }\n`;
    }
  }

  // Al 100% reiniciamos al inicio, igual que en tus flips manuales
  css += `  100% { margin-top: ${startY}px; }\n`;
  css += `}\n\n`;

  css += `.flipDynamic {\n`;
  css += `  animation: flipDynamic var(--stream-carousel-duration, ${usedDuration}s)\n`;
  css += `    cubic-bezier(0.23, 1, 0.32, 1.2) infinite;\n`;
  css += `}\n\n`;

  return css;
}

const StreamWordCarousel = ({
  title = "Word swipe animation:",
  values = [],
  duration, // opcional: sobreescribe la duración por defecto (segundos)
  className = "",
  wrapperStyle = {},
  titleStyle = {},
  listStyle = {},
  // Props para integrarlo a tu sistema de Card
  configCard = {},

  // 🔧 Nuevas props de control
  align = "center", // "left" | "center" | "right"
  valuesAlign = "left", // "left" | "center" | "right"
  fontWeight = 400,
  titleGap = 8,

  // 🆕 velocidad de cambio: 1 = normal, 2 = más rápido, 0.5 = más lento
  speed = 1,
}) => {
  const count = values.length;

  // Elegimos la animación según el número de palabras
  let flipClass = "";
  let defaultDuration = 6; // valor base

  console.log(count);

  if (count <= 1) {
    flipClass = ""; // sin animación si solo hay una palabra
    defaultDuration = 6;
  } else if (count === 2) {
    flipClass = "flip0";
    defaultDuration = 6;
  } else if (count === 3) {
    flipClass = "flip1";
    defaultDuration = 8;
  } else if (count === 4) {
    flipClass = "flip2";
    defaultDuration = 10;
  } else if (count === 5) {
    flipClass = "flip3";
    defaultDuration = 12;
  } else {
    // más de 5 → usamos flipDynamic, sin tocar flip0..3
    flipClass = "flipDynamic";
    defaultDuration = 14; // un poco más lenta para listas grandes
  }

  const baseDuration = duration ?? defaultDuration;
  const safeSpeed = speed > 0 ? speed : 1;
  const usedDuration = baseDuration / safeSpeed;

  // Mapeos de alineación para flex / text-align
  const justifyMap = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  const valuesJustifyMap = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  // 🔹 Tus animaciones manuales para 2–5 palabras (no las toco)
  let flips = [
    `
    @keyframes flip0 {
        0% { margin-top: -180px; }
        5% { margin-top: -90px;  }
        50% { margin-top: -90px; }
        55% { margin-top: 0px; }
        99.99% { margin-top: 0px; }
        100% { margin-top: -180px; }
      }
      `,
    `
  @keyframes flip1 {
        0% { margin-top: -270px; }
        5% { margin-top: -180px; }
        33% { margin-top: -180px; }
        38% { margin-top: -90px; }
        66% { margin-top: -90px; }
        71% { margin-top: 0px; }
        99.99% { margin-top: 0px; }
        100% { margin-top: -270px; }
      }


      `,
    `
      @keyframes flip2 {
        0% { margin-top: -360px; }
        5% { margin-top: -270px; }
        25% { margin-top: -270px; }
        30% { margin-top: -180px; }
        50% { margin-top: -180px; }
        55% { margin-top: -90px; }
        75% { margin-top: -90px; }
        80% { margin-top: 0px; }
        99.99% { margin-top: 0px; }
        100% { margin-top: -360px; }
      }



    `,
    `      @keyframes flip3 {
        0% { margin-top: -450px; }
        5% { margin-top: -360px; }
        20% { margin-top: -360px; }
        25% { margin-top: -270px; }
        40% { margin-top: -270px; }
        45% { margin-top: -180px; }
        60% { margin-top: -180px; }
        65% { margin-top: -90px; }
        80% { margin-top: -90px; }
        85% { margin-top: 0px; }
        99.99% { margin-top: 0px; }
        100% { margin-top: -450px; }
      }


    `,
  ];

  let increment = 4;
  let p0 = 90;
  flips = flips.map((flip, index) => {
    increment = increment + 2;
    p0 = p0 + 90;

    return ` ${flip}

.flip${index} {
  animation: flip${index} var(--stream-carousel-duration, ${increment}s)
    cubic-bezier(0.23, 1, 0.32, 1.2) infinite;
}
`;
  });

  // 🔹 CSS extra si hay más de 5 palabras (flipDynamic)
  const dynamicFlipCss =
    count > 5 ? createExtraFlipLarge(count, STEP_PX, usedDuration) : "";

  return (
    <>
      <style>{`
        .stream-word-carousel {
          display: flex;
          align-items: center;
          justify-content: var(--swc-justify, center);
          font-size: var(--swc-font-size, 24px);
          font-weight: var(--swc-font-weight, 400);
        }

        .stream-word-carousel > span {
          margin-right: var(--swc-title-gap, 8px);
        }

        .stream-word-carousel-inner {
          overflow: hidden;
          position: relative;

          /* Ventana lógica del carrusel:
             45px del li + "aire" visual alrededor */
          height: 45px;
          padding-top: 10px;
          padding-bottom: 10px;
          text-align: center;
        }

        .stream-word-carousel-inner ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .stream-word-carousel-inner li {
          padding: 0 10px;
          height: 45px;
          margin-bottom: 45px;
          display: flex;
          align-items: center;
          justify-content: var(--swc-values-justify, flex-start);
          text-align: var(--swc-values-text-align, left);
        }

        /* 🆕 Imágenes grandes dentro de los <li> */
        .stream-word-carousel-inner li img {
          max-height: 45px;   /* encaja en el alto del li */
          width: auto;        /* respeta proporción */
          display: block;
        }

        ${flips.join("\n")}
        ${dynamicFlipCss}
      `}</style>

      <Card {...configCard}>
        <h4
          className={`stream-word-carousel ${className}`}
          style={{
            "--stream-carousel-duration": `${usedDuration}s`,
            "--swc-justify": justifyMap[align] ?? "center",
            "--swc-font-size": `inherent`,
            "--swc-font-weight": fontWeight,
            "--swc-title-gap": `${titleGap}px`,
            "--swc-values-justify":
              valuesJustifyMap[valuesAlign] ?? "flex-start",
            "--swc-values-text-align": valuesAlign,
            ...wrapperStyle,
          }}
        >
          <span style={titleStyle}>{title}</span>

          <div className="stream-word-carousel-inner">
            <ul className={flipClass} style={listStyle}>
              {values.map((value, idx) => (
                <li key={idx}>{value}</li>
              ))}
            </ul>
          </div>
        </h4>
      </Card>
    </>
  );
};

export default StreamWordCarousel;
