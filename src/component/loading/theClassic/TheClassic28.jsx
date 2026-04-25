import React from "react";

const TheClassic28 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader  {
        width: fit-content;
        font-weight: bold;
        font-family: monospace;
        font-size: 30px;
        overflow: hidden;
        animation: l28 2s infinite;
      }
      .loader::before {
        content:"${text}";
      }
      @keyframes l28{
        0%,10%  {transform:perspective(300px) rotate(0)      rotateY(0)      rotateX(0)}
        30%,36% {transform:perspective(300px) rotate(.5turn) rotateY(0)      rotateX(0)}
        63%,69% {transform:perspective(300px) rotate(.5turn) rotateY(180deg) rotateX(0)}
        90%,100%{transform:perspective(300px) rotate(.5turn) rotateY(180deg) rotateX(180deg)}
      }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic28;
