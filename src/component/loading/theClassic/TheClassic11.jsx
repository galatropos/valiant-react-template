import React from "react";

const TheClassic11 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        font-weight: bold;
        font-family: monospace;
        font-size: 30px;
        display: inline-grid;
        overflow: hidden;
      }
      .loader:before,
      .loader:after {
        content: "${text}";
        grid-area: 1/1;
        clip-path: inset(0 -200% 50%);
      }
      @keyframes l11 {
        80%  {text-shadow:    0  0 0 #000,10ch 0 0 #000;background-size:100% 3px}
        100% {text-shadow: -10ch 0 0 #000,0    0 0 #000}
      }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic11;
