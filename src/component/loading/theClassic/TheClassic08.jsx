import React from "react";

const TheClassic08 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        width: fit-content;
        font-weight: bold;
        font-family: monospace;
        font-size: 30px;
        color:#0000;
        background:linear-gradient(90deg,#000 calc(50% - 0.5ch),#C02942 0 calc(50% + 0.5ch),#000 0) right/calc(200% + 1ch) 100%;
        -webkit-background-clip:text;
        background-clip:text;
        animation: l8 2s infinite steps(11);
      }
      .loader:before {
        content: "${text}";
      }
      @keyframes l8 { to { background-position: left; } }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic08;
