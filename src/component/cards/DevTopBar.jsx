// src/component/cards/DevTopBar.jsx
import React from "react";

/**
 * DevTopBar (minimal)
 * - Muestra etiqueta, alias y valor actual del hotkey activo
 * - No captura eventos (pointer-events: none)
 * - Tipografía más grande a petición (legible en pantallas grandes)
 */
export default function DevTopBar({ show, label = "", alias = "", value = null }) {
  if (!show) return null;

  const textLeft = `${label}${alias ? ` (${alias.toUpperCase()})` : ""}`;
  const textRight =
    value === null || typeof value === "undefined"
      ? ""
      : (typeof value === "number"
          ? String(Math.round(value * 1000) / 1000)
          : String(value));

  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2147483647,
        background: "rgba(0, 0, 0, 0.65)",
        color: "#fff",
        borderRadius: 12,
        padding: "10px 16px",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        gap: 12,
        // === Tipografía más grande ===
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 20,      // antes ~12–14px → ahora 20px
        lineHeight: 1.15,
        letterSpacing: "0.25px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ opacity: 0.95 }}>{textLeft}</span>
      {textRight && (
        <span
          style={{
            opacity: 0.9,
            paddingLeft: 10,
            marginLeft: 6,
            borderLeft: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          {textRight}
        </span>
      )}
    </div>
  );
}
