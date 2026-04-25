// BlackFridayMarqueeBody.jsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

function useOrientationMode() {
  const getIsPortrait = () => {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      return window.matchMedia("(orientation: portrait)").matches;
    }
    if (typeof window !== "undefined") {
      return window.innerHeight >= window.innerWidth;
    }
    return true;
  };

  const [mode, setMode] = useState(getIsPortrait() ? "portrait" : "landscape");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onChange = () => {
      setMode(getIsPortrait() ? "portrait" : "landscape");
    };

    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener?.("change", onChange);
    mq.addListener?.(onChange);

    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);

    return () => {
      mq.removeEventListener?.("change", onChange);
      mq.removeListener?.(onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, []);

  return mode;
}

// Frase original (la seguimos usando para mantener sentido)
const PHRASE = " BLACK FRIDAY SALE";

// Partimos explícitamente en dos:
// " BLACK FRIDAY " → blanco
// "SALE" → rojo
const PHRASE_BEFORE_SALE = " BLACK FRIDAY ";
const PHRASE_SALE = "SALE";

// Secuencia vertical: cada elemento puede tener tipo y color
// - CHAR → una letra con color
// - SPACE_AFTER → espacio extra entre el texto y el punto rojo
// - DOT → el punto rojo final
const V_SEQ = [
  // Letras en blanco (incluye el espacio inicial y el espacio antes de SALE)
  ...Array.from(PHRASE_BEFORE_SALE).map((ch) => ({
    type: "CHAR",
    char: ch,
    color: "#FFFFFF", // blanco
  })),
  // Letras en rojo (SALE)
  ...Array.from(PHRASE_SALE).map((ch) => ({
    type: "CHAR",
    char: ch,
    color: "#EE222B", // rojo
  })),
  { type: "SPACE_AFTER" },
  { type: "DOT" },
];

const BlackFridayMarqueeBody = () => {
  if (typeof document === "undefined") return null;

  const mode = useOrientationMode();
  const isPortrait = mode === "portrait";

  const baseContainerStyle = {
    zIndex: 999,
    overflow: "hidden",
    background: "linear-gradient(90deg, #000000, #222222)",
  };

  const trackStyleBase = {
    display: "inline-block",
    whiteSpace: "nowrap",
    color: "#FFD700",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.25em",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  // Portrait (vertical del dispositivo) → barras horizontales ARRIBA/ABAJO
  const trackStyleHorizontal = {
    ...trackStyleBase,
    padding: "0.5rem 0",
    fontSize: "0.7rem",
  };

  // Landscape (horizontal del dispositivo) → barras laterales con texto vertical
  const trackStyleVertical = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "#FFD700", // color base, pero los chars tendrán su propio color inline
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.25em",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  const itemStyleHorizontal = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.8rem",
    marginRight: "2.5rem",
  };

  const dotStyle = {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#ff0000",
    flexShrink: 0,
  };

  const renderItemsHorizontal = () =>
    Array.from({ length: 10 }).map((_, i) => (
      <span key={i} style={itemStyleHorizontal}>
        <span>
          <span
            style={{
              color: "#FFF",
            }}
          >
            BLACK FRIDAY&nbsp;
          </span>
          <span
            style={{
              color: "#EE222B",
            }}
          >
            SALE
          </span>{" "}
          &nbsp; &nbsp;
        </span>
        <span style={dotStyle} />
      </span>
    ));

  const charRowStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "1.1rem",
    fontSize: "0.7rem",
  };

  const renderCharsVertical = () =>
    V_SEQ.map((item, idx) => {
      if (item.type === "DOT") {
        return (
          <div
            key={idx}
            style={{
              ...charRowStyle,
              marginTop: "0.3rem", // espacio visible antes del punto rojo
            }}
          >
            <span style={dotStyle} />
          </div>
        );
      }

      if (item.type === "SPACE_AFTER") {
        return (
          <div
            key={idx}
            style={{
              ...charRowStyle,
              height: "0.8rem", // espacio en blanco
            }}
          >
            {""}
          </div>
        );
      }

      // item.type === "CHAR"
      return (
        <div
          key={idx}
          style={{
            ...charRowStyle,
            color: item.color || "#FFFFFF",
          }}
        >
          {item.char}
        </div>
      );
    });

  // Portrait → barras horizontales (arriba y abajo) con texto horizontal
  // 🔹 Ahora un poquito más lento: 36s
  const horizontalBars = (
    <>
      {/* Barra superior horizontal */}
      <div
        style={{
          ...baseContainerStyle,
          position: "fixed",
          left: 0,
          right: 0,
          top: 0,
          borderTop: "2px solid #ff0000",
          borderBottom: "2px solid #ff0000",
        }}
      >
        <div
          style={{
            ...trackStyleHorizontal,
            animation: "blackFridayScrollX 36s linear infinite",
          }}
        >
          {renderItemsHorizontal()}
          {renderItemsHorizontal()}
        </div>
      </div>

      {/* Barra inferior horizontal → se mueve en sentido contrario */}
      <div
        style={{
          ...baseContainerStyle,
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          borderTop: "2px solid #ff0000",
          borderBottom: "2px solid #ff0000",
        }}
      >
        <div
          style={{
            ...trackStyleHorizontal,
            animation: "blackFridayScrollX 36s linear infinite reverse",
          }}
        >
          {renderItemsHorizontal()}
          {renderItemsHorizontal()}
        </div>
      </div>
    </>
  );

  // Vertical: helper para el track
  // Landscape sigue a 28s
  const VerticalTrack = ({ reverse = false }) => (
    <div
      style={{
        ...trackStyleVertical,
        animation: `blackFridayScrollY 28s linear infinite${
          reverse ? " reverse" : ""
        }`,
      }}
    >
      {Array.from({ length: 8 }).map((_, idx) => (
        <React.Fragment key={idx}>{renderCharsVertical()}</React.Fragment>
      ))}
    </div>
  );

  // Landscape → barras verticales (izquierda y derecha) un poquito más delgadas
  const verticalBars = (
    <>
      {/* Barra izquierda vertical - sube */}
      <div
        style={{
          ...baseContainerStyle,
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          width: "40px",
          borderLeft: "2px solid #ff0000",
          borderRight: "2px solid #ff0000",
          display: "block",
        }}
      >
        <VerticalTrack reverse={false} />
      </div>

      {/* Barra derecha vertical - baja */}
      <div
        style={{
          ...baseContainerStyle,
          position: "fixed",
          top: 0,
          bottom: 0,
          right: 0,
          width: "40px",
          borderLeft: "2px solid #ff0000",
          borderRight: "2px solid #ff0000",
          display: "block",
        }}
      >
        <VerticalTrack reverse={true} />
      </div>
    </>
  );

  const content = (
    <>
      <style>{`
        @keyframes blackFridayScrollX {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Muchas copias verticales, movemos -50% para que siga ciclando */
        @keyframes blackFridayScrollY {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
      {isPortrait ? horizontalBars : verticalBars}
    </>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default BlackFridayMarqueeBody;
