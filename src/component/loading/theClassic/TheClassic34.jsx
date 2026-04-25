import React from "react";

const TheClassic34 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        width: fit-content;
        font-weight: bold;
        font-family: monospace;
        white-space: pre;
        font-size: 30px;
      }
      .loader:before {
        content: "${text}";
        animation: l34 1s infinite alternate;
      }
      @keyframes l34{
        0%,15%,75%,100% {
          content:"${text}";
        }
        20% {content:"${text}"}
        25% {content:"Lo ding..."}
        30% {content:"Load ng..."}
        35% {content:" oading..."}
        40% {content:"L ading..."}
        45% {content:"Loadin ..."}
        50% {content:"Loa ing..."}
        55% {content:"Loading  ."}
        60% {content:" oa ing..."}
        65% {content:"L ading..."}
        70% {content:"Load n ..."}
      }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic34;
