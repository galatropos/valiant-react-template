import React from "react";

const TheClassic09 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        width: fit-content;
        font-weight: bold;
        font-family: monospace;
        font-size: 30px;
        color :#0000;
        overflow: hidden;
        animation: l9 5s infinite cubic-bezier(0.3,1,0,1);
      }
      .loader:before {
        content: "${text}";
      }
      @keyframes l9 {
        0%,100%{background-position:0 0}
        25% {background-position: calc(1*100%/3) 0}
        50% {background-position: calc(2*100%/3) 0}
        75% {background-position: calc(3*100%/3) 0}
        100%{background-position: calc(4*100%/3) 0}
      }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic09;
