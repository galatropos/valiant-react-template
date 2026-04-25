import React from "react";

const TheClassic04 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        width: fit-content;
        font-weight: bold;
        font-family: monospace;
        font-size: 30px;
        clip-path: inset(0 3ch 0 0);
        animation: l4 1s steps(4) infinite;
      }
      .loader:before {
        content: "${text}";
      }
      @keyframes l4 { to { clip-path: inset(0 -1ch 0 0); } }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic04;
