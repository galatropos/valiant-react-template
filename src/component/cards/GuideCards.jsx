// src/component/cards/GuideCards.jsx
import React from "react";
import { createPortal } from "react-dom";

/**
 * GuideCards
 * Componente de utilería para visualizar guías en modo desarrollo.
 * API estable (sin la barra negra superior). La barra negra ahora vive en CardDevLayer.
 *
 * Props:
 * - showTopBar: boolean (sólo mantiene compatibilidad; aquí ya no se dibuja nada con esto)
 * - showMidlines: boolean -> si true, dibuja líneas guía sobre el viewport
 * - guideMid: { topY, bottomY, leftX, rightX } en coordenadas CSS pixels
 * - colorGuide: color CSS para las líneas (por defecto "red")
 */
export default function GuideCards({
  showTopBar = false,         // compat, no dibuja aquí
  showMidlines = false,
  guideMid = null,
  colorGuide = "red",
}) {
  // Si no hay nada que dibujar, no portalizamos
  if (!showMidlines || !guideMid) return null;

  const { topY, bottomY, leftX, rightX } = guideMid || {};

  // Estilos base para las líneas
  const baseLine = {
    position: "fixed",
    zIndex: 2147482000,
    pointerEvents: "none",
    background: colorGuide,
    opacity: 0.65,
  };

  const hStyleTop = {
    ...baseLine,
    left: 0,
    top: `${Math.round(topY)}px`,
    width: "100vw",
    height: "1px",
  };
  const hStyleBottom = {
    ...baseLine,
    left: 0,
    top: `${Math.round(bottomY)}px`,
    width: "100vw",
    height: "1px",
  };
  const vStyleLeft = {
    ...baseLine,
    top: 0,
    left: `${Math.round(leftX)}px`,
    width: "1px",
    height: "100vh",
  };
  const vStyleRight = {
    ...baseLine,
    top: 0,
    left: `${Math.round(rightX)}px`,
    width: "1px",
    height: "100vh",
  };

  return createPortal(
    <>
      {/* Líneas horizontales (top/bottom) */}
      <div data-guide="h-top" style={hStyleTop} />
      <div data-guide="h-bottom" style={hStyleBottom} />

      {/* Líneas verticales (left/right) */}
      <div data-guide="v-left" style={vStyleLeft} />
      <div data-guide="v-right" style={vStyleRight} />
    </>,
    document.body
  );
}
