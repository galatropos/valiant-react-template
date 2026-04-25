// GradientPortalOverlay.jsx
import React from "react";
import ReactDOM from "react-dom";
import hexadecimalToRgba from "../utils/hexadecimalToRgba"; // ajusta la ruta si hace falta

/**
 * GradientPortalOverlay
 *
 * Props:
 * - direction: "top" | "bottom" | "left" | "right"
 *   - "top"    → degradado desde arriba hacia abajo
 *   - "bottom" → degradado desde abajo hacia arriba
 *   - "left"   → degradado desde la izquierda hacia la derecha
 *   - "right"  → degradado desde la derecha hacia la izquierda
 *
 * - color: string (hex o rgb) → "#000000", "#3300CF", "rgb(51,0,207)", etc.
 * - opacity: número 0–1 → intensidad del color (1 = opaco, 0.5 = 50%)
 * - stopPercent: número 0–100 → hasta dónde llega el degradado de color
 *      Ej:
 *        stopPercent = 20  → 0% (color) → 20% (transparente) → 100% (transparente)
 * - zIndex: opcional, por defecto 9999
 *
 * - usePortal: boolean
 *      true  → se pinta en document.body (global)
 *      false → se pinta inline donde lo llames (misma jerarquía que tus Cards)
 *
 * El overlay NO bloquea clics (pointerEvents: "none").
 */
const GradientPortalOverlay = ({
  direction = "top",
  color = "#000000",
  opacity = 0.8,
  stopPercent = 20, // 0..100, hasta dónde llega el color
  zIndex = 9999,
  usePortal = true,
  children,
}) => {
  if (typeof document === "undefined") return null;

  const dir = String(direction).toLowerCase();

  // Dirección del degradado en CSS
  let angle;
  switch (dir) {
    case "top":
      angle = "to bottom"; // color arriba, se va desvaneciendo hacia abajo
      break;
    case "bottom":
      angle = "to top"; // color abajo, se va desvaneciendo hacia arriba
      break;
    case "left":
      angle = "to right"; // color izquierda → derecha
      break;
    case "right":
      angle = "to left"; // color derecha → izquierda
      break;
    default:
      angle = "to bottom";
  }

  // Clamp de los valores
  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  const clampedStop = Math.max(0, Math.min(100, stopPercent));

  // Color con opacidad (inicio)
  const colorRgba = hexadecimalToRgba(color, clampedOpacity);
  // Color transparente (mismo tono pero alpha 0)
  const colorTransparent = hexadecimalToRgba(color, 0);

  // Degradado:
  //  0%           → color con opacidad
  //  stopPercent% → transparente
  //  100%         → transparente
  const background = `linear-gradient(
    ${angle},
    ${colorRgba} 0%,
    ${colorTransparent} ${clampedStop}%,
    ${colorTransparent} 100%
  )`;

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex,
    pointerEvents: "none",
    background,
  };

  const content = <div style={overlayStyle} />;

  // 🔹 MODO INLINE (no sale del padre)
  if (!usePortal) {
    return content;
  }

  // 🔹 MODO PORTAL (global)
  return ReactDOM.createPortal(content, document.body);
};

export default GradientPortalOverlay;
