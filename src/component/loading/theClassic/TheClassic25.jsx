import React from "react";

const TheClassic25 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader  {
        width: fit-content;
        font-weight: bold;
        font-family: monospace;
        font-size: 30px;
        animation: l25 1s infinite;
      }
      .loader::before {
        content:"${text}";
      }
      @keyframes l25{
        0%,12.5% {transform: translate(10px,0)}
        13%,25%  {transform: translate(4px,-4px)}
        26%,37.5%{transform: translate(2px,8px)}
        38%,50%  {transform: translate(12px,-6px)}
        51%,62.5%{transform: translate(0,12px)}
        63%,75%  {transform: translate(-8px,-4px)}
        76%,86.5%{transform: translate(-12px,6px)}
        87%,100% {transform: translate(6px,0)}
      }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic25;
