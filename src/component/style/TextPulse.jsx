// src/component/effects/pulse/TextPulse.jsx
import React from "react";

const TextPulse = ({
  classNameAssing,
  textColor = "#ffffff",
  glowStrongColor = "rgba(255, 106, 61, 0.75)",
  glowSoftColor = "rgba(255, 106, 61, 0.45)",
  durationMs = 1200,
  scaleTo = 1.08,
}) => {
  if (!classNameAssing) return null;

  const durationSec =
    typeof durationMs === "number" && durationMs > 0 ? durationMs / 1000 : 1.2;

  return (
    <style>{`
      .${classNameAssing}{
        color: ${textColor};
        animation: textPulse ${durationSec}s ease-in-out infinite;
        text-shadow:
          0 0 6px ${glowStrongColor},
          0 0 14px ${glowSoftColor};
        will-change: transform, opacity;
      }

      @keyframes textPulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(${scaleTo});
          opacity: 1;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      @media (prefers-reduced-motion: reduce){
        .${classNameAssing}{
          animation: none !important;
        }
      }
    `}</style>
  );
};

export default TextPulse;