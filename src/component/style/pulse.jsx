// src/component/effects/pulse/Pulse.jsx
import React from "react";

const Pulse = ({
  classNameAssing,
  durationMs = 900,
  pauseMs = 0,
  scale = 1.06,
  ease = "ease-in-out",
  delayMs = 0,
}) => {
  if (!classNameAssing) return null;

  const safeDurationMs = Math.max(1, durationMs);
  const safePauseMs = Math.max(0, pauseMs);
  const safeDelayMs = Math.max(0, delayMs);

  const totalMs = safeDurationMs + safePauseMs;

  const upPct = (safeDurationMs * 0.5 / totalMs) * 100;
  const downPct = (safeDurationMs / totalMs) * 100;

  return (
    <style>{`
      .${classNameAssing}{
        animation-name: pulseAnim-${classNameAssing};
        animation-duration: ${totalMs}ms;
        animation-delay: ${safeDelayMs}ms;
        animation-iteration-count: infinite;
        animation-fill-mode: both;
        transform-origin: center;
      }

      @keyframes pulseAnim-${classNameAssing}{
        0%{
          transform: scale(1);
          animation-timing-function: ${ease};
        }

        ${upPct}%{
          transform: scale(${scale});
          animation-timing-function: ${ease};
        }

        ${downPct}%{
          transform: scale(1);
        }

        100%{
          transform: scale(1);
        }
      }
    `}</style>
  );
};

export default Pulse;