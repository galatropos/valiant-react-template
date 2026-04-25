// src/components/FooterMarquee.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function FooterMarquee({
  children,
  speed = 10,          // segundos que tarda en cruzar la pantalla (más bajo = más rápido)
  gap = 40,            // espacio entre repeticiones en px
  height = 30,         // alto de la cinta en px
  zIndex = 9999,       // para que quede por encima de casi todo
  background = "#000", // color de fondo de la franja
  color = "#fff",      // color de la letra por defecto
  fontSize = 12,       // tamaño de fuente en px (afecta todo el contenido interno)
  repeat = 4,          // cuántas veces se repite el contenido dentro del track
}) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Inyectamos los estilos solo una vez
    if (document.getElementById("footer-marquee-styles")) return;

    const style = document.createElement("style");
    style.id = "footer-marquee-styles";
    style.textContent = `
      .footer-marquee {
        width: 100%;
        overflow: hidden;
        display: flex;          /* para centrar verticalmente */
        align-items: center;    /* centra el contenido en el eje Y */
      }

      .footer-marquee__viewport {
        width: 100%;
        overflow: hidden;
      }

      .footer-marquee__track {
        display: flex;
        width: max-content;
        animation: footer-marquee-scroll var(--footer-marquee-speed, 20s) linear infinite;
      }

      .footer-marquee__group {
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
      }

      .footer-marquee__gap {
        display: inline-block;
        flex: 0 0 auto;
      }

      @keyframes footer-marquee-scroll {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(var(--footer-marquee-distance, -50%));
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (typeof document === "undefined") {
    // En SSR / build estático no renderizamos nada
    return null;
  }

  // Nos aseguramos de tener al menos 2 repeticiones
  const repeatCount = Math.max(2, repeat);
  // Distancia que recorre el track en una animación completa (una “unidad” de grupo)
  const distance = -100 / repeatCount; // ej: repeat=4 -> -25%

  const marquee = (
    <div
      className="footer-marquee"
      style={{
        position: "fixed",          // pegado a la ventana, no al padre
        left: 0,
        right: 0,
        bottom: -2,                 // 👈 lo dejamos a -2px como pediste
        height,                     // alto exacto de la cinta
        minHeight: height,
        zIndex,
        background,
        color,
        fontSize,                   // tamaño de fuente aplicado a todo el contenido
        "--footer-marquee-speed": `${speed}s`,
      }}
    >
      <div className="footer-marquee__viewport">
        <div
          className="footer-marquee__track"
          style={{
            "--footer-marquee-distance": `${distance}%`,
          }}
        >
          {Array.from({ length: repeatCount }).map((_, idx) => (
            <div className="footer-marquee__group" key={idx}>
              {children}
              <span
                className="footer-marquee__gap"
                style={{ width: gap }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Usamos un portal para montarlo directamente en <body>
  return createPortal(marquee, document.body);
}
