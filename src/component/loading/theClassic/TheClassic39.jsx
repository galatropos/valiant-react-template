import React from "react";

const TheClassic39 = ({ text = "Loading..." }) => (
  <>
    <style>{`
      .loader {
        width: fit-content;
        font-weight: bold;
        font-family: monospace;
        white-space: pre;
        font-size: 30px;
        line-height: 1.2em;
        height:1.2em;
        overflow: hidden;
      }
      .loader:before {
        content:"Loading...\A⌰oading...\A⌰⍜ading...\A⌰⍜⏃ding...\A⌰⍜⏃⎅ing...\A⌰⍜⏃⎅⟟ng...\A⌰⍜⏃⎅⟟⋏g...\A⌰⍜⏃⎅⟟⋏☌...\A⌰⍜⏃⎅⟟⋏☌⟒..\A⌰⍜⏃⎅⟟⋏☌⟒⏁.\A⌰⍜⏃⎅⟟⋏☌⟒⏁⋔";
        white-space: pre;
        display: inline-block;
        animation: l39 1s infinite steps(11) alternate;
      }
      @keyframes l39 {100%{transform: translateY(-100%)}}
    `}</style>
    <div className="loader" />
  </>
);

export default TheClassic39;
