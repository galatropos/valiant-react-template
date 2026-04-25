import React from "react";

const TheClassic16 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        --w:10ch;
        font-weight: bold;
        font-family: monospace;
        font-size: 30px;
        letter-spacing: var(--w);
        width:var(--w);
        overflow: hidden;
        white-space: nowrap;
        text-shadow: 
          calc(-1*var(--w)) 0, 
          calc(-2*var(--w)) 0,
          calc(-3*var(--w)) 0, 
          calc(-4*var(--w)) 0, 
          calc(-5*var(--w)) 0, 
          calc(-6*var(--w)) 0, 
          calc(-7*var(--w)) 0, 
          calc(-8*var(--w)) 0, 
          calc(-9*var(--w)) 0;
        animation: l16 2s infinite;
      }
      .loader:before {
        content:"${text}";
      }
      @keyframes l16 { 20% {text-shadow: calc(-1*var(--w)) 0, calc(-2*var(--w)) 0 red, calc(-3*var(--w)) 0, calc(-4*var(--w)) 0 #ffa516, calc(-5*var(--w)) 0 #63fff4, calc(-6*var(--w)) 0, calc(-7*var(--w)) 0, calc(-8*var(--w)) 0, calc(-9*var(--w)) 0;} }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic16;
