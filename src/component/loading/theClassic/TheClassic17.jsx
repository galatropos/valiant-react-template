import React from "react";

const TheClassic17 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        --w:10ch;
        font-weight: bold;
        font-family: monospace;
        font-size: 30px;
        line-height: 1.2em;
        letter-spacing: var(--w);
        width: var(--w);
        overflow: hidden;
        white-space: nowrap;
        color: #0000;
        animation: l17 2s infinite;
      }
      .loader:before {
        content:"${text}";
      }
      @keyframes l17 {
         0% {text-shadow: calc( 0*var(--w)) -1.2em #000,calc(-1*var(--w)) -1.2em #000,calc(-2*var(--w)) -1.2em #000,calc(-3*var(--w)) -1.2em #000,calc(-4*var(--w)) -1.2em #000, calc(-5*var(--w)) -1.2em #000,calc(-6*var(--w)) -1.2em #000,calc(-7*var(--w)) -1.2em #000,calc(-8*var(--w)) -1.2em #000,calc(-9*var(--w)) -1.2em #000}
         16% {text-shadow: calc( 0*var(--w)) 0      #000,calc(-1*var(--w)) 0      #000,calc(-2*var(--w)) 0      #000,calc(-3*var(--w)) 0      #000,calc(-4*var(--w)) -1.2em #000, calc(-5*var(--w)) 0      #000,calc(-6*var(--w)) 0      #000,calc(-7*var(--w)) -1.2em #000,calc(-8*var(--w)) -1.2em #000,calc(-9*var(--w)) -1.2em #000}
      }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic17;
