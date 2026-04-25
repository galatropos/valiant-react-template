import React from "react";

const TheClassic10 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        font-weight: bold;
        font-family: monospace;
        font-size: 30px;
        display: inline-grid;
      }
      .loader:before,
      .loader:after {
        content:"${text}";
        grid-area: 1/1;
      }
      .loader:after {
        clip-path: inset(50% -200% 0%);
        text-shadow: 10ch 0 0;
        --s:-1;
      }
      @keyframes l10 {50%,100%{transform: translateX(calc(var(--s,1)*100%));}}
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic10;
