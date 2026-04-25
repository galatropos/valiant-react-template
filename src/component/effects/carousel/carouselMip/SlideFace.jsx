// SlideFace.jsx
import React from "react";

export default function SlideFace({
  src,
  title,
  objectFit = "contain",  // "cover" si quieres que llene recortando
  imgScale = 1,           // 1 = sin zoom; 1.15 = 15% más grande
  bg = "#000",
  children,               // por si quieres meter más divs/overlays externos
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: bg,         // ⬅️ div de fondo
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Imagen base */}
      <img
        src={src}
        alt={title}
        title={title}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
          objectPosition: "50% 50%",
          display: "block",
          transform: `scale(${imgScale})`,
          transformOrigin: "50% 50%",
        }}
      />

      {/* Overlay de ejemplo (otro DIV encima) */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          right: 12,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none", // no bloquea gestos del carrusel
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.45)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 14,
          }}
        >
          {title}
        </div>
      </div>

      {/* Espacio para más cosas */}
      {children}
    </div>
  );
}
