// StreamText.jsx
import React from "react";
import Card from "../../Card";

const StreamText = ({
  text1,
  text2,
  duration = 7,
  color = "#555",
  align = "center",        // "left" | "center" | "right"
  gap = 4,                 // espacio entre text1 y text2 en px
  direction = "left",      // "left" o "right"
  revealMaxWidth = 1000,   // ancho máximo efectivo del texto2
  className = "",
  wrapperStyle = {},
  text1Style = {},
  text2Style = {},
  portrait,
  landscape
}) => {
  // Desde qué lado entra el texto2
  const slideFrom = direction === "right" ? "100%" : "-100%";


  const confiBlank={
    style: {
      background:"#FFF",
      border:"solid 1px red"
    },
    portrait,
    landscape
  }
  


  return (
    <>
      <style>{`
        .animated-wrapper {
          display: inline-block;
          text-align: var(--stream-align, center);
          color: var(--stream-color, #555);
          font-size: var(--stream-font-size, 24px);
          overflow: hidden;
          white-space: nowrap;
          -webkit-backface-visibility: hidden;
          -webkit-perspective: 1000;
          -webkit-transform: translate3d(0,0,0);
        }

        .animated-wrapper div {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
        }

        .animated-wrapper .animated-gap {
          display: inline-block;
          width: var(--stream-gap, 4px);
        }

        /* Primer texto */
        .animated-wrapper div:first-of-type {
          animation: showup var(--stream-duration, 7s) infinite;
        }

        /* Contenedor del segundo texto */
        .animated-wrapper div:last-of-type {
          max-width: 0;
          animation: reveal var(--stream-duration, 7s) infinite;
          animation-timing-function: ease-in-out;
        }

        /* Texto2 que se desliza */
        .animated-wrapper div:last-of-type span {
          display: inline-block;
          transform: translateX(var(--stream-slide-from, -100%));
          animation: slidein var(--stream-duration, 7s) infinite;
        }

        @keyframes showup {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes slidein {
          0%   { transform: translateX(var(--stream-slide-from, -100%)); }
          25%  { transform: translateX(var(--stream-slide-from, -100%)); }
          45%  { transform: translateX(0); }
          100% { transform: translateX(0); }
        }

        @keyframes reveal {
          0%   { opacity: 0; max-width: 0; }
          20%  { opacity: 1; max-width: 0; }
          50%  { max-width: var(--stream-reveal-max, 1000px); }
          80%  { opacity: 1; max-width: var(--stream-reveal-max, 1000px); }
          100% { opacity: 0; max-width: var(--stream-reveal-max, 1000px); }
        }
      `}</style>

      <Card {...confiBlank} >

      <div
        className={`animated-wrapper ${className}`}
        style={{
          "--stream-duration": `${duration}s`,
          "--stream-color": color,
          "--stream-font-size": `inherent`,
          "--stream-align": align,
          "--stream-gap": `${gap}px`,
          "--stream-slide-from": slideFrom,
          "--stream-reveal-max": `${revealMaxWidth}px`,
          ...wrapperStyle,
        }}
      >
        <div style={text1Style}>
          {text1}
          <span className="animated-gap" />
        </div>
        <div style={text2Style}>
          <span>{text2}</span>
        </div>
      </div>
    </Card>
    </>

  );
};

export default StreamText;
