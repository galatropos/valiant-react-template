import React from "react";

const TheClassic38 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        width: fit-content;
        font-weight: bold;
        font-family: monospace;
        white-space: pre;
        font-size: 30px;
        line-height: 1.2em;
        height: 1.2em;
        overflow: hidden;
      }
      .loader:before {
        content:"Loading...\AgodnLai...\Aoiaglni...\ALiongad...\Agindola...\Analoidg...";
        white-space: pre;
        display:inline-block;
        animation: l38 1s infinite steps(6);
      }
      @keyframes l38 {
        100%{transform: translateY(-100%)}
      }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic38;
