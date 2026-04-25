import React from "react";

const TheClassic03 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        width: fit-content;
        font-weight: bold;
        font-family: sans-serif;
        font-size: 30px;
        padding: 0 5px 8px 0;
        background: repeating-linear-gradient(90deg,currentColor 0 8%,#0000 0 10%) 200% 100%/200% 3px no-repeat;
        animation: l3 2s steps(6) infinite;
      }
      .loader:before {
        content: "${text}";
      }
      @keyframes l3 { to { background-position: 80% 100%; } }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic03;
