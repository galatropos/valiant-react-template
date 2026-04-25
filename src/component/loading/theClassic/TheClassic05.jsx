import React from "react";

const TheClassic05 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        width: fit-content;
        font-weight: bold;
        font-family: monospace;
        font-size: 30px;
        clip-path: inset(0 100% 0 0);
        animation: l5 2s steps(11) infinite;
      }
      .loader:before {
        content: "${text}";
      }
      @keyframes l5 { to { clip-path: inset(0 -1ch 0 0); } }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic05;
