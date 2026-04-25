// src/component/effects/carousel/carouselMip/VirtualizedPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { Page } from "./Page";

const range = [-2, -1, 0, 1, 2];

export const VirtualizedPage = ({
  children,

  // Tamaño del contenedor
  sizeMode = "layout", // "layout" | "visual"

  // Layout
  slideWidthPct = 1,
  gapPx = 0,
  centerScale = 1,
  compensateGap = false,
  sideOuterGapPx = 0,

  // Escala “alrededor”
  scaleMode = "center", // "center" | "sides"
  sidesScale = 0.9,

  // Dirección principal del carrusel
  // "horizontal": izquierda↔derecha
  // "vertical":   abajo↕arriba
  direction = "horizontal",

  // 3D
  mode3D = "none", // "none" | "coverflow" | "v" | "stage" | "ring"
  vOffset = 40,    // ← intensidad de la V, llega desde CarouselMip

  // Blur en slides laterales (se usa dentro de Page)
  // px de blur; si es undefined, Page puede usar su default interno.
  blurSide,

  // Nudge (empujoncito)
  nudgeOnStart = false,
  nudgePx = 28,
  nudgeDelayMs = 400,
  nudgeDuration = 0.3,
  nudgePauseMs = 1400,
  stopNudgeOnInteract = true,
  resumeNudgeAfterMs = 30000,

  // Control de patrón de nudge
  nudgeMode = "both", // "both" | "left" | "right" | "pattern"
  nudgeLeftPx,
  nudgeRightPx,
  nudgePattern = [], // [{dx, duration, pause}]

  // AUTO-SLIDE
  automatic = false,
  automaticIntervalMs = 4000,

  // Tap
  tapUrl,
  onTapSlide,
  tapChangeMode = "default", // "default" | "next" | "prev"

  // Tracking
  initialIndex = 0,
  onIndexChangeRaw,

  // Tap estricto (opcional)
  strictTapEnabled = false,
  strictTapThresholdPx = 6,
  strictTapMaxMs = 300,

  // Snap (suavidad del desplazamiento entre slides)
  // snapDurationMs en MILISEGUNDOS
  snapDurationMs = 800,
  snapEase = "easeInOut",
}) => {
  const x = useMotionValue(0);
  const containerRef = useRef(null);
  const [index, setIndex] = useState(initialIndex || 0);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const nudgeCancelledRef = useRef(false);
  const inactivityTimerRef = useRef(null);
  const [nudgeVersion, setNudgeVersion] = useState(0);

  const autoTimerRef = useRef(null);

  useEffect(() => {
    onIndexChangeRaw?.(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const readSize = () => {
    if (!containerRef.current) return { w: 0, h: 0 };
    if (sizeMode === "visual") {
      const r = containerRef.current.getBoundingClientRect();
      return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
    }
    return {
      w: Math.max(1, containerRef.current.clientWidth || 0),
      h: Math.max(1, containerRef.current.clientHeight || 0),
    };
  };

  const getMainSize = () =>
    direction === "horizontal" ? containerSize.w : containerSize.h;

  const snapSize = () => {
    const main = getMainSize();
    if (main <= 0) return 1;
    const slideMain = Math.max(1, main * slideWidthPct);
    return Math.max(1, slideMain + gapPx);
  };

  const calculateNewX = () => -index * snapSize();

  const swipeThresholdPx = () => Math.max(24, getMainSize() * 0.2);

  const getSnapTransition = () => ({
    type: "tween",
    duration: Math.max(0.01, snapDurationMs / 1000),
    ease: snapEase,
  });

  const handleEndDrag = (_e, dragProps) => {
    const { offset, velocity } = dragProps;

    const primaryOffset =
      direction === "horizontal" ? offset.x : offset.y;
    const primaryVelocity =
      direction === "horizontal" ? velocity.x : velocity.y;
    const crossVelocity =
      direction === "horizontal" ? velocity.y : velocity.x;

    if (Math.abs(crossVelocity) > Math.abs(primaryVelocity)) {
      animate(x, calculateNewX(), getSnapTransition());
      return;
    }

    const th = swipeThresholdPx();
    if (primaryOffset > th) {
      setIndex((i) => i - 1);
    } else if (primaryOffset < -th) {
      setIndex((i) => i + 1);
    } else {
      animate(x, calculateNewX(), getSnapTransition());
    }
  };

  const stopNudgeAndScheduleResume = () => {
    if (!stopNudgeOnInteract) return;
    nudgeCancelledRef.current = true;
    x.stop();
    x.set(calculateNewX());
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      nudgeCancelledRef.current = false;
      setNudgeVersion((v) => v + 1);
    }, resumeNudgeAfterMs);
  };

  useEffect(() => {
    const transition = getSnapTransition();
    const controls = animate(x, calculateNewX(), transition);
    return controls.stop;
  }, [
    index,
    containerSize.w,
    containerSize.h,
    gapPx,
    slideWidthPct,
    direction,
    snapDurationMs,
    snapEase,
  ]);

  useEffect(() => {
    const update = () => setContainerSize(readSize());
    update();

    let ro = null;
    if (typeof window !== "undefined" && "ResizeObserver" in window) {
      ro = new ResizeObserver(update);
      if (containerRef.current) ro.observe(containerRef.current);
    }
    window.addEventListener("resize", update);

    return () => {
      if (ro && containerRef.current) ro.unobserve(containerRef.current);
      window.removeEventListener("resize", update);
    };
  }, [sizeMode]);

  useEffect(() => {
    x.set(calculateNewX());
  }, [
    gapPx,
    slideWidthPct,
    containerSize.w,
    containerSize.h,
    direction,
  ]);

  useEffect(() => {
    if (!automatic) {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      return;
    }

    if (getMainSize() <= 0) return;

    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }

    autoTimerRef.current = setInterval(() => {
      setIndex((i) => i + 1);
    }, automaticIntervalMs);

    return () => {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [
    automatic,
    automaticIntervalMs,
    containerSize.w,
    containerSize.h,
    direction,
  ]);

  const handleTapSlideInternal = (pageIndex) => {
    if (tapChangeMode === "next") {
      setIndex((i) => i + 1);
      return;
    }
    if (tapChangeMode === "prev") {
      setIndex((i) => i - 1);
      return;
    }
    if (onTapSlide) {
      onTapSlide(pageIndex);
    }
  };

  const effectiveOnTapSlide =
    tapChangeMode === "default" && !onTapSlide
      ? undefined
      : handleTapSlideInternal;

  useEffect(() => {
    if (!nudgeOnStart) return;
    if (getMainSize() <= 0) return;
    if (nudgeCancelledRef.current) return;

    let isMounted = true;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const L =
      typeof nudgeLeftPx === "number" ? nudgeLeftPx : nudgePx;
    const R =
      typeof nudgeRightPx === "number" ? nudgeRightPx : nudgePx;

    const springBack = { type: "spring", stiffness: 300, damping: 28 };

    const buildSteps = () => {
      if (
        nudgeMode === "pattern" &&
        Array.isArray(nudgePattern) &&
        nudgePattern.length
      ) {
        return nudgePattern.map((p) => ({
          dx: Number(p?.dx || 0),
          duration: Number.isFinite(p?.duration)
            ? p.duration
            : nudgeDuration,
          pause: Number.isFinite(p?.pause) ? p.pause : nudgePauseMs,
        }));
      }

      if (nudgeMode === "left") {
        return [
          {
            dx: -Math.abs(L),
            duration: nudgeDuration,
            pause: nudgePauseMs,
          },
        ];
      }

      if (nudgeMode === "right") {
        return [
          {
            dx: +Math.abs(R),
            duration: nudgeDuration,
            pause: nudgePauseMs,
          },
        ];
      }

      return [
        {
          dx: -Math.abs(L),
          duration: nudgeDuration,
          pause: nudgePauseMs,
        },
        {
          dx: +Math.abs(R),
          duration: nudgeDuration,
          pause: nudgePauseMs,
        },
      ];
    };

    const steps = buildSteps();

    const run = async () => {
      await sleep(nudgeDelayMs);
      if (!isMounted || nudgeCancelledRef.current) return;

      while (isMounted && !nudgeCancelledRef.current) {
        const base = calculateNewX();
        x.set(base);

        for (const step of steps) {
          if (!isMounted || nudgeCancelledRef.current) break;

          const stepEase = {
            type: "tween",
            duration: step.duration,
            ease: "easeOut",
          };

          await animate(x, base + step.dx, stepEase).finished;
          if (!isMounted || nudgeCancelledRef.current) break;

          await animate(x, base, springBack).finished;
          if (!isMounted || nudgeCancelledRef.current) break;

          await sleep(step.pause);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [
    nudgeOnStart,
    containerSize.w,
    containerSize.h,
    nudgePx,
    nudgeLeftPx,
    nudgeRightPx,
    nudgeMode,
    nudgePattern,
    nudgeDelayMs,
    nudgeDuration,
    nudgePauseMs,
    index,
    nudgeVersion,
    direction,
  ]);

  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: gapPx === 0 ? "hidden" : "visible",
        boxSizing: "border-box",
        minWidth: 0,
        minHeight: 0,
        perspective:
          mode3D === "v" || mode3D === "coverflow" || mode3D === "stage" || mode3D === "ring"
            ? "800px"
            : "none",
        transformStyle:
          mode3D === "v" || mode3D === "coverflow" || mode3D === "stage" || mode3D === "ring"
            ? "preserve-3d"
            : "flat",
      }}
      onPointerDown={stopNudgeAndScheduleResume}
    >
      {range.map((r) => (
        <Page
          key={r + index}
          x={x}
          onDragStart={stopNudgeAndScheduleResume}
          onDragEnd={handleEndDrag}
          index={r + index}
          centerIndex={index}
          renderPage={children}
          containerWidth={containerSize.w}
          containerHeight={containerSize.h}
          direction={direction}
          slideWidthPct={slideWidthPct}
          gapPx={gapPx}
          centerScale={centerScale}
          compensateGap={compensateGap}
          sideOuterGapPx={sideOuterGapPx}
          scaleMode={scaleMode}
          sidesScale={sidesScale}
          strictTapEnabled={strictTapEnabled}
          strictTapThresholdPx={strictTapThresholdPx}
          strictTapMaxMs={strictTapMaxMs}
          tapUrl={tapUrl}
          onTapSlide={effectiveOnTapSlide}
          mode3D={mode3D}
          vOffset={vOffset}
          blurSide={blurSide}
        />
      ))}
    </motion.div>
  );
};

VirtualizedPage.displayName = "VirtualizedPage";
