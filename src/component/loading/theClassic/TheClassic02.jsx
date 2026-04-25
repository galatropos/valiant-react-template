import React from "react";

const TheClassic02 = ({ text = "Loading...", srcImage } ) => 
  {
    return(
    <>
    <style>{`
      .loader {
        width: fit-content;
        font-weight: bold;
        font-family: sans-serif;
        font-size: 30px;
        padding-bottom: 8px;
        background: linear-gradient(currentColor 0 0) 0 100%/0% 3px no-repeat;
        animation: l2 2s linear infinite;
      }
      .loader:before {
        content: "${text}";
      }
      @keyframes l2 { to { background-size: 100% 3px; } }
    `}</style>
    <img src={srcImage} alt="loading" />
    <div className="loader" />
  </>
);
      }

export default TheClassic02;
