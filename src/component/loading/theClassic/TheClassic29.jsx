import React from "react";

const TheClassic29 = ({ text = "Loading..." }) => (
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
        -webkit-mask:linear-gradient(90deg,#000 50%,#0000 0) 0 50%/2ch 100%;
        animation: l29 2s infinite;
      }
      .loader:after {
        -webkit-mask-position:1ch 50%;
        --s:-1;
      }
      @keyframes l29 {
        /* Add keyframe logic if needed, original CSS may require more for full effect. */
      }
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic29;
