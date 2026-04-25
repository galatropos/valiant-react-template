import React from "react";

const TheClassic15 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        font-weight: bold;
        font-family: monospace;
        font-size: 30px;
        line-height: 1.2em;
        display: inline-grid;
      }
      .loader:before,
      .loader:after {
        content:"${text}";
        grid-area: 1/1;
        animation: l15 1s infinite;
      }
      .loader:after {
        -webkit-mask-position: 1ch 50%;
        --s:-1;
      }
      @keyframes l15 {80%,100%{text-shadow:0 calc(var(--s,1)*-1.2em)  0 #000,0 0 0 #000}}
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic15;
