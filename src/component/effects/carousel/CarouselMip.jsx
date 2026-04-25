// src/component/effects/carousel/CarouselMip.jsx
import React from "react";
import ReactDOM from "react-dom";
import "./carouselMip/styles.css";
import { VirtualizedPage } from "./carouselMip/VirtualizedPage";

// índice lógico cíclico
const wrap = (i, n) => ((i % n) + n) % n;

/**
 * Carousel por elementos que llena el 100% del contenedor padre
 * o, si fullScreen=true, el 100% del viewport (body).
 *
 * Props principales:
 * - slides: React.ReactNode[]                         (REQUIRED)
 * - initialIndex?: number                             (default 0)
 * - onIndexChange?: (logicalIdx:number)=>void         (0..N-1)
 *
 * Layout / escala:
 * - sizeMode?: "layout" | "visual"                    (default "layout")
 * - slideWidthPct?: number                            (default 1)
 * - gapPx?: number                                    (default 0)
 * - centerScale?: number                              (default 1)
 * - compensateGap?: boolean                           (default false)
 * - sideOuterGapPx?: number                           (default 0)
 * - scaleMode?: "center" | "sides"                    (default "center")
 * - sidesScale?: number                               (default 0.9)
 * - direction?: "horizontal" | "vertical"             (default "horizontal")
 *
 * 3D:
 * - mode3D?: "none" | "coverflow" | "v" | "stage"     (default "none")
 *   - "none"      → plano
 *   - "coverflow" → estilo Cover Flow
 *   - "v"         → tarjetas en forma de V
 *   - "stage"     → efecto escenario/puertas
 * - vOffsetPx?: number                                (default 40)  ← intensidad de la "V"
 *
 * Blur de los slides laterales:
 * - blurSide?: number                                 (intensidad en px; 0 para quitar blur)
 *
 * Nudge (empujoncito): 
 * - nudgeOnStart?: boolean                            
 * - nudgePx?: number                                  
 * - nudgeDelayMs?: number                             
 * - nudgeDuration?: number                            
 * - nudgePauseMs?: number                             
 * - stopNudgeOnInteract?: boolean                     
 * - resumeNudgeAfterMs?: number                       
 * - nudgeMode?: "both" | "left" | "right" | "pattern" 
 * - nudgeLeftPx?: number
 * - nudgeRightPx?: number
 * - nudgePattern?: Array<{ dx:number, duration?:number, pause?:number }>
 *
 * Auto:
 * - automatic?: boolean                               
 * - automaticIntervalMs?: number                      
 *
 * Tap:
 * - tapUrl?: string
 * - onTapSlide?: (rawIndex:number)=>void
 * - tapChangeMode?: "default" | "next" | "prev"       (default "default")
 *
 * Snap (suavidad del desplazamiento entre slides):
 * - snapDurationMs?: number                           (default 800 ms)
 * - snapEase?: string                                 (default "easeInOut")
 *
 * Otros:
 * - wrapSlide?: (node:ReactNode, logicalIndex:number)=>ReactNode
 * - style?: React.CSSProperties
 * - fullScreen?: boolean                              (si true → ocupa todo el viewport)
 */
export default function CarouselMip({
  slides = [],

  // tracking
  initialIndex = 0,
  onIndexChange,

  // layout / escala
  sizeMode = "layout",
  slideWidthPct = 1,
  gapPx = 0,
  centerScale = 1,
  compensateGap = false,
  sideOuterGapPx = 0,
  scaleMode = "center",
  sidesScale = 0.9,
  direction = "horizontal",

  // 3D
  mode3D = "none",
  vOffsetPx = 40, // ← antes V_OFFSET, ahora prop

  // blur en slides laterales
  blurSide, // intensidad de blur en los side (px). Usa 0 para quitarlo.

  // nudge
  nudgeOnStart = false,
  nudgePx,
  nudgeDelayMs,
  nudgeDuration,
  nudgePauseMs,
  stopNudgeOnInteract,
  resumeNudgeAfterMs,
  nudgeMode = "both",
  nudgeLeftPx,
  nudgeRightPx,
  nudgePattern,

  // auto
  automatic = false,
  automaticIntervalMs = 4000,

  // tap
  tapUrl,
  onTapSlide,
  tapChangeMode = "default",

  // snap (suavidad)
  snapDurationMs = 800,
  snapEase = "easeInOut",

  // otros
  wrapSlide,
  style,
  fullScreen = false,
}) {
  const count = Array.isArray(slides) ? slides.length : 0;
  if (!count) return null;

  const handleIndexChangeRaw = (raw) => {
    const logical = wrap(raw, count);
    onIndexChange?.(logical);
  };

  const content = (
    <div
      style={{
        position: fullScreen ? "fixed" : "absolute",
        inset: 0,
        width: fullScreen ? "100vw" : "100%",
        height: fullScreen ? "100vh" : "100%",
        zIndex: fullScreen ? 9999 : "auto",
        ...style,
      }}
    >
      <VirtualizedPage
        // layout / escala
        sizeMode={sizeMode}
        slideWidthPct={slideWidthPct}
        gapPx={gapPx}
        centerScale={centerScale}
        compensateGap={compensateGap}
        sideOuterGapPx={sideOuterGapPx}
        scaleMode={scaleMode}
        sidesScale={sidesScale}
        direction={direction}
        // 3D
        mode3D={mode3D}
        vOffset={vOffsetPx}
        // blur en laterales
        blurSide={blurSide}
        // nudge
        nudgeOnStart={nudgeOnStart}
        nudgePx={nudgePx}
        nudgeDelayMs={nudgeDelayMs}
        nudgeDuration={nudgeDuration}
        nudgePauseMs={nudgePauseMs}
        stopNudgeOnInteract={stopNudgeOnInteract}
        resumeNudgeAfterMs={resumeNudgeAfterMs}
        nudgeMode={nudgeMode}
        nudgeLeftPx={nudgeLeftPx}
        nudgeRightPx={nudgeRightPx}
        nudgePattern={nudgePattern}
        // auto
        automatic={automatic}
        automaticIntervalMs={automaticIntervalMs}
        // tap
        tapUrl={tapUrl}
        onTapSlide={onTapSlide}
        tapChangeMode={tapChangeMode}
        // tracking
        initialIndex={initialIndex}
        onIndexChangeRaw={handleIndexChangeRaw}
        // snap (suavidad)
        snapDurationMs={snapDurationMs}
        snapEase={snapEase}
      >
        {({ index }) => {
          const i = wrap(index, count);
          const node = slides[i];
          const filled = (
            <div style={{ width: "100%", height: "100%" }}>
              {node}
            </div>
          );
          return wrapSlide ? wrapSlide(filled, i) : filled;
        }}
      </VirtualizedPage>
    </div>
  );

  if (!fullScreen || typeof document === "undefined") {
    return content;
  }

  return ReactDOM.createPortal(content, document.body);
}
