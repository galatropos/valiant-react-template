import React from "react";

const TheClassic06 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        --c:#000;
        width: fit-content;
        font-weight: bold;
        font-family: monospace;
        font-size: 30px;
        color: #0000;
        overflow: hidden;
        text-shadow: 0 0 var(--c),11ch 0 var(--c);
        animation: l6 2s infinite linear;
      }
      .loader:before {
        content: "${text}";
      }
      @keyframes l6 { to { text-shadow: -11ch 0 var(--c),0ch 0 var(--c); } }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic06;
