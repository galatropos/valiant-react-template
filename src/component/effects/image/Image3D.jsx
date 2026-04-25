// src/component/effects/image/Image3D.jsx
import React from "react";
import { motion } from "framer-motion";
import PopBoardShuffleScale from "../pop/PopBoardShuffleScale";

/**
 * Image3D (3D real con sombra que sigue a la imagen)
 *
 * - Usa perspective + rotateX/rotateY (3D REAL).
 * - La sombra va en el mismo elemento que rota, así la sigue SIEMPRE.
 * - La imagen NO tiene filtros ni sombras extra (para no provocar artefactos).
 *
 * IMPORTANTE:
 * - Para evitar que se vea más "quebrado" de lo necesario:
 *   - No uses filters (drop-shadow, blur, etc.) sobre este componente.
 *   - Evita que sus padres tengan transform 3D adicionales.
 *   - Evita overflow: hidden en el padre si quieres ver toda la sombra.
 */

export default function Image3D({
  src,
  alt = "",
  borderRadius = 0,
  shadow = false,
  tiltX = 0,          // inclinación vertical en grados
  tiltY = 0,          // inclinación horizontal en grados
  style = {},
  perspective = 600,  // profundidad del 3D
  bgColor = "transparent",   // fondo del área de imagen
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        // Escenario 3D
        perspective: `${perspective}px`,
        transformStyle: "flat",
        ...style,
      }}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          // 👉 La sombra está aquí, y este es el que rota
          boxShadow: shadow ? "0 18px 50px rgba(0,0,0,0.9)" : "none",
          borderRadius,
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          overflow: "visible", // que no corte la sombra
        }}
        initial={{ rotateX: tiltX, rotateY: tiltY }}
        animate={{ rotateX: tiltX, rotateY: tiltY }}
        transition={{ duration: 0 }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius,
            overflow: "hidden",    // recorta SOLO la imagen, no la sombra
            backgroundColor: bgColor,
          }}
        >

          <img
            src={src}
            alt={alt}
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
