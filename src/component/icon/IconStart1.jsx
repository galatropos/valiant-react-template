import React from "react";

// IconStart1: maneja múltiples estrellas según el value
// - value: número de estrellas "llenas" con decimales (ej: 5.5, 5.2, 5.8)
// - maxStars: cuántas estrellas en total dibuja (por defecto 5)
// - emptyColor: color de las estrellas "vacías" (de fondo)
const IconStart1 = ({
  size = 16,               // tamaño de cada estrella en px
  color = "currentColor",  // color del relleno (parte llena)
  emptyColor = "rgba(255,255,255,0.25)", // color de la estrella vacía
  value = 0,               // ejemplo: 5.5 => 5 llenas + 1 parcial
  maxStars = 5,            // total de posiciones de estrella
  gap = 2,                 // espacio entre estrellas en px
  style = {},              // estilos extra para el CONTENEDOR principal
  ...props
}) => {
  const safeValue = Math.max(0, Math.min(maxStars, value));

  // ⭐ Path de una estrella de 5 puntas más puntiaguda
  const starPath =
    "M7.5 0 L9.18 4.76 L14.29 5.09 L10.23 8.3 L11.51 13.27 L7.5 10.6 L3.49 13.27 L4.77 8.3 L0.71 5.09 L5.82 4.76 Z";

  const stars = [];
  for (let i = 0; i < maxStars; i++) {
    // amount = cuánto se llena esta estrella:
    // 0 = vacía, 1 = llena, 0.5 = mitad, etc.
    const amount = Math.max(0, Math.min(1, safeValue - i)); // 0..1
    const fillWidth = size * amount; // ancho en px de la parte "rellena"

    stars.push(
      <div
        key={i}
        style={{
          position: "relative",
          width: size,
          height: size,
          display: "inline-block",
          verticalAlign: "middle",
          marginLeft: i > 0 ? gap : 0,
        }}
      >
        {/* Estrella base (vacía / fondo) SIEMPRE completa */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 15 15"
          fill={emptyColor}
          style={{
            width: size,
            height: size,
            display: "block",
          }}
          {...props}
        >
          <path d={starPath} />
        </svg>

        {/* Capa de relleno (solo si amount > 0) */}
        {amount > 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: fillWidth,
              height: size,
              overflow: "hidden",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 15 15"
              fill={color}
              style={{
                width: size,
                height: size,
                display: "block",
              }}
              {...props}
            >
              <path d={starPath} />
            </svg>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        ...style,
      }}
    >
      {stars}
    </div>
  );
};

export default IconStart1;
