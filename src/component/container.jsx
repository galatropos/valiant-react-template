// src/layout/ScaledContainer.jsx
import { useEffect, useState } from "react";
import { ScaleContext } from "../context/contextScale";

/**
 * ScaledContainer
 * - Escala un lienzo lógico (900x1600 / 1600x900) al viewport con scale uniforme.
 * - Dibuja un "marco" por ENCIMA del contenido sin tocar a los hijos (overlay interno).
 *
 * Props adicionales para el marco:
 *  - showFrame     (bool)   -> muestra/oculta el marco (default: true si mode==="developer", si no false)
 *  - frameColor    (string) -> color del marco (default: "#3300CF")
 *  - frameWidth    (number) -> grosor del marco en px (default: 2)
 *  - frameRadius   (number) -> border-radius del marco en px (default: 0)
 *  - frameOutside  (bool)   -> añade anillo externo adicional (no tapa contenido) (default: false)
 *
 * Nota: No se modifica ningún hijo. El borde se pinta en una capa overlay con z-index muy alto.
 */
export default function ScaledContainer({
  children,
  mode = "client",
  showFrame: showFrameProp,
  frameColor = "gray",
  frameWidth = 2,
  frameRadius = 0,
  frameOutside = false,
}) {
  const [scaleData, setScaleData] = useState({
    x: 1,
    y: 1,
    min: 1,
    width: 0,
    height: 0,
    renderedWidth: 0,
    renderedHeight: 0,
    media: "portrait",
  });

  const scaleContainer = () => {
    const min = 900;
    const max = 1600;

    const isPortrait = window.innerWidth <= window.innerHeight;
    const baseWidth = isPortrait ? min : max;
    const baseHeight = isPortrait ? max : min;

    const scaleX = window.innerWidth / baseWidth;
    const scaleY = window.innerHeight / baseHeight;
    const minScale = Math.min(scaleX, scaleY);

    setScaleData({
      x: scaleX,
      y: scaleY,
      min: minScale,
      width: baseWidth,
      height: baseHeight,
      renderedWidth: baseWidth * minScale,
      renderedHeight: baseHeight * minScale,
      media: isPortrait ? "portrait" : "landscape",
    });
  };

  useEffect(() => {
    scaleContainer();
    window.addEventListener("resize", scaleContainer);

    // Opcional: mejora en móviles con teclado / pinch
    const vv = window.visualViewport;
    const onVV = () => scaleContainer();
    vv?.addEventListener("resize", onVV);
    vv?.addEventListener("scroll", onVV);

    return () => {
      window.removeEventListener("resize", scaleContainer);
      vv?.removeEventListener("resize", onVV);
      vv?.removeEventListener("scroll", onVV);
    };
  }, []);

  // Mostrar marco por defecto solo en modo developer, a menos que se pase showFrame explícito
  const showFrame = typeof showFrameProp === "boolean" ? showFrameProp : (mode === "developer");

  // Contenedor escalado
  const containerStyle = {
    width: `${scaleData.width}px`,
    height: `${scaleData.height}px`,
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: `translate(-50%, -50%) scale(${scaleData.min})`,
    transformOrigin: "center center",

    // Importante: NO usamos border/outline aquí para evitar que queden debajo del contenido.
    // El "marco" se pinta con una capa overlay por encima (más abajo).
    borderRadius: `${frameRadius}px`,
    // Evita que algo recorte el overlay por accidente:
    overflow: "visible",
  };

  // Capa de marco por ENCIMA del contenido
  const overlayBorderStyle = showFrame
    ? {
        position: "absolute",
        inset: 0,
        outline: `${frameWidth}px solid ${frameColor}`,
        borderRadius: `${frameRadius}px`,
        pointerEvents: "none",     // No bloquea interacciones del contenido
        zIndex: 2147483647,        // Encima de hijos con transform/filters
        boxSizing: "border-box",
      }
    : null;

  // Anillo externo opcional (no tapa el contenido)
  const overlayOuterRingStyle = showFrame && frameOutside
    ? {
        position: "absolute",
        inset: 0,
        borderRadius: `${frameRadius}px`,
        pointerEvents: "none",
        zIndex: 2147483647,
        boxSizing: "border-box",
        boxShadow: `0 0 0 ${frameWidth}px ${frameColor}`,
      }
    : null;

  return (
    <ScaleContext.Provider value={scaleData}>
      <div className="container" style={containerStyle} id="container">
        {/* Marco por encima del contenido */}
        {showFrame && <div aria-hidden="true" style={overlayBorderStyle} />}
        {showFrame && frameOutside && <div aria-hidden="true" style={overlayOuterRingStyle} />}
        {/* Contenido */}
        {children}
      </div>
    </ScaleContext.Provider>
  );
}
