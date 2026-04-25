// src/component/effects/carousel/carouselMip/Page.jsx
import React, { useMemo, useRef } from "react";
import { motion, useTransform } from "framer-motion";

export const Page = ({
  index,
  centerIndex,
  renderPage,
  x,
  onDragStart,
  onDragEnd,
  containerWidth,
  containerHeight,          // 👈 alto del contenedor
  direction = "horizontal", // "horizontal" | "vertical"

  // Layout
  slideWidthPct = 1,
  gapPx = 0,

  // Escala
  centerScale = 1,
  compensateGap = false,
  sideOuterGapPx = 0,

  // Escala alrededor
  scaleMode = "center", // "center" | "sides"
  sidesScale = 0.9,

  // 3D
  // "none"      → plano
  // "coverflow" → centro grande, lados inclinados
  // "v"         → forma de V
  // "stage"     → escenario/puertas
  // "ring"      → anillo 3D tipo carrusel
  mode3D = "none",
  vOffset = 40, // 👈 solo usado en modo "v"

  // Blur en slides laterales
  // px de blur; si es undefined, se usa el valor por defecto (10px en 3D)
  blurSide,

  // Tap
  strictTapEnabled = false,
  strictTapThresholdPx = 6,
  strictTapMaxMs = 300,
  tapUrl,
  onTapSlide,
}) => {
  const child = useMemo(() => renderPage({ index }), [index, renderPage]);

  // ─────────────────────────────
  //   GEOMETRÍA SEGÚN DIRECCIÓN
  // ─────────────────────────────

  const mainSize =
    direction === "horizontal"
      ? Math.max(1, containerWidth)
      : Math.max(1, containerHeight || 0);

  if (!mainSize || mainSize <= 0) {
    return null;
  }

  const slideMain = Math.max(1, mainSize * slideWidthPct);
  const snapMain = slideMain + gapPx;

  const centerOffset = (mainSize - slideMain) / 2;

  // En modo "ring" apilamos todos en el centro (como un escenario),
  // en otros modos usamos el layout normal en línea
  const baseMainRaw = index * snapMain + centerOffset;
  const baseMain =
    mode3D === "ring"
      ? centerOffset
      : baseMainRaw;

  // Este slide está centrado cuando x == -(index * snapMain)
  const centerXForThis = -(index * snapMain);

  // ─────────────────────────────
  //   ESCALA del contenido
  // ─────────────────────────────
  const contentScale = useTransform(
    x,
    [centerXForThis - snapMain, centerXForThis, centerXForThis + snapMain],
    scaleMode === "sides" ? [sidesScale, 1, sidesScale] : [1, centerScale, 1]
  );

  const centerXForCenter = -(centerIndex * snapMain);
  const centerScaleNow = useTransform(
    x,
    [centerXForCenter - snapMain, centerXForCenter, centerXForCenter + snapMain],
    [1, centerScale, 1]
  );

  const extraGap = useTransform(centerScaleNow, (s) => {
    if (scaleMode === "sides") return 0;
    return compensateGap ? Math.max(0, ((s - 1) * slideMain) / 2) : 0;
  });

  const rel = index - centerIndex; // posición relativa al centro

  // Vecinos inmediatos
  const isNeighbor = Math.abs(rel) === 1;
  const neighborShiftSign = rel === -1 ? -1 : rel === 1 ? 1 : 0;
  const neighborShift = useTransform(extraGap, (eg) =>
    isNeighbor ? neighborShiftSign * eg : 0
  );

  // Orillas (|rel| >= 2)
  const outerLevels = Math.max(0, Math.abs(rel) - 1);
  const outerShiftMain =
    outerLevels * sideOuterGapPx * (rel < 0 ? -1 : rel > 0 ? 1 : 0);

  // ─────────────────────────────
  //   3D: COVERFLOW + STAGE
  // ─────────────────────────────
  const maxAngleCoverflow = 35;
  const maxAngleStage = 70;       // más efecto "puertas"
  const sideScale3D = 0.85;
  const centerScale3D = 1.2;
  const stageDepth = mainSize * 0.9; // qué tan "profundo" se ve

  const angleValues =
    mode3D === "coverflow"
      ? [maxAngleCoverflow, 0, -maxAngleCoverflow]
      : mode3D === "stage"
      ? [maxAngleStage, 0, -maxAngleStage]
      : [0, 0, 0];

  const scale3dValues =
    mode3D === "coverflow"
      ? [sideScale3D, centerScale3D, sideScale3D]
      : [1, 1, 1];

  const depthValues =
    mode3D === "stage"
      ? [-stageDepth, 0, -stageDepth]
      : [0, 0, 0];

  const rotateY3DBase = useTransform(
    x,
    [centerXForThis - snapMain, centerXForThis, centerXForThis + snapMain],
    angleValues
  );

  const scale3D = useTransform(
    x,
    [centerXForThis - snapMain, centerXForThis, centerXForThis + snapMain],
    scale3dValues
  );

  const translateZStage = useTransform(
    x,
    [centerXForThis - snapMain, centerXForThis, centerXForThis + snapMain],
    depthValues
  );

  // ─────────────────────────────
  //   MODO "RING": anillo 3D
  // ─────────────────────────────
  const ringAngleStep = 40;             // separación angular entre slides
  const ringRadius = mainSize * 0.9;    // radio del anillo

  // Rotación global del anillo a partir de x (cada snapMain → un paso)
  const ringRotation = useTransform(x, (v) => {
    if (!snapMain) return 0;
    return (v / snapMain) * ringAngleStep;
  });

  // ángulo base según la posición relativa al centro
  const ringBaseAngle = rel * ringAngleStep;

  // rotateY final en modo ring: base + rotación global
  const rotateYRing = useTransform(ringRotation, (rot) => ringBaseAngle + rot);

  // ─────────────────────────────
  //   MODO "V": lados vs centro
  // ─────────────────────────────
  const vOffsetMain = useTransform(
    x,
    [centerXForThis - snapMain, centerXForThis, centerXForThis + snapMain],
    mode3D === "v"
      ? [-vOffset, vOffset, -vOffset]
      : [0, 0, 0]
  );

  const vOffsetStyle =
    direction === "horizontal"
      ? { y: vOffsetMain }
      : { x: vOffsetMain };

  // ─────────────────────────────
  //   BLUR EN LOS SIDES (con blurSide)
  // ─────────────────────────────
  const sideBlur = typeof blurSide === "number" ? blurSide : 10;

  const blurAmount = useTransform(
    x,
    [centerXForThis - snapMain, centerXForThis, centerXForThis + snapMain],
    mode3D === "coverflow" || mode3D === "v" || mode3D === "stage" || mode3D === "ring"
      ? [sideBlur, 0, sideBlur]
      : [0, 0, 0]
  );

  const blurFilter = useTransform(blurAmount, (b) => `blur(${b}px)`);

  // combinamos la escala normal con la extra 3D (solo coverflow / stage)
  const finalScale = useTransform(
    [contentScale, scale3D],
    ([base, extra]) => base * extra
  );

  // rotateY final según el modo
  const rotateYFinal =
    mode3D === "ring"
      ? rotateYRing
      : rotateY3DBase;

  // profundidad final (z) según el modo
  const zFinal =
    mode3D === "ring"
      ? ringRadius
      : translateZStage;

  // ─────────────────────────────
  //   TAP / DRAG
  // ─────────────────────────────
  const dragStartedRef = useRef(false);
  const downRef = useRef({ x: 0, y: 0, t: 0 });

  const handleDragStartLocal = (e, info) => {
    dragStartedRef.current = true;
    onDragStart && onDragStart(e, info);
  };

  const handleDragEndLocal = (e, info) => {
    onDragEnd && onDragEnd(e, info);
    queueMicrotask(() => {
      dragStartedRef.current = false;
    });
  };

  const handleTap = () => {
    if (dragStartedRef.current) return;
    if (onTapSlide) {
      onTapSlide(index);
      return;
    }
    if (tapUrl) {
      window.location.href = tapUrl;
    }
  };

  const handlePointerDown = (e) => {
    if (!strictTapEnabled) return;
    const p = "touches" in e ? e.touches[0] : e;
    downRef.current = { x: p.clientX, y: p.clientY, t: performance.now() };
  };

  const handlePointerUp = (e) => {
    if (!strictTapEnabled) return;
    const p = "changedTouches" in e ? e.changedTouches[0] : e;
    const dx = Math.abs(p.clientX - downRef.current.x);
    const dy = Math.abs(p.clientY - downRef.current.y);
    const dt = performance.now() - downRef.current.t;

    if (
      !dragStartedRef.current &&
      dx < strictTapThresholdPx &&
      dy < strictTapThresholdPx &&
      dt < strictTapMaxMs
    ) {
      handleTap();
    }
  };

  // ─────────────────────────────
  //   STYLES SEGÚN DIRECCIÓN
  // ─────────────────────────────

  const dragAxis = direction === "horizontal" ? "x" : "y";

  const baseStyle =
    direction === "horizontal"
      ? {
          width: `${slideMain}px`,
          height: "100%",
          left: `${baseMain}px`,
          top: 0,
        }
      : {
          width: "100%",
          height: `${slideMain}px`,
          top: `${baseMain}px`,
          left: 0,
        };

  // En modo ring ya no movemos el contenedor por x/y,
  // solo usamos x para animar la rotación del anillo.
  const motionPosStyle =
    mode3D === "ring"
      ? {}
      : direction === "horizontal"
      ? { x }
      : { y: x };

  const outerTransform =
    mode3D === "ring"
      ? "none"
      : direction === "horizontal"
      ? `translateX(${outerShiftMain}px)`
      : `translateY(${outerShiftMain}px)`;

  const neighborShiftStyle =
    mode3D === "ring"
      ? {}
      : direction === "horizontal"
      ? { x: neighborShift }
      : { y: neighborShift };

  // zIndex: el centro siempre al frente
  const zIndex = 100 - Math.abs(rel);

  return (
    <motion.div
      style={{
        position: "absolute",
        ...baseStyle,
        ...motionPosStyle,
        overflow: gapPx === 0 ? "hidden" : "visible",
        boxSizing: "border-box",
        willChange: "transform",
        zIndex,
      }}
      drag={dragAxis}
      dragElastic={1}
      onDragStart={handleDragStartLocal}
      onDragEnd={handleDragEndLocal}
      onTap={handleTap}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Empuje constante para orillas (solo 2D) */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: outerTransform,
          willChange: "transform",
        }}
      >
        {/* Vecinos + escala del contenido */}
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center",
            ...neighborShiftStyle,
          }}
        >
          <motion.div
            style={{
              width: "100%",
              height: "100%",
              scale: finalScale,
              rotateY: rotateYFinal,
              z: zFinal,              // 👈 profundidad (ring / stage)
              filter: blurFilter,
              transformOrigin: "50% 50%",
              ...vOffsetStyle,
            }}
          >
            {/* Tu contenido: 100% aquí llena EXACTO el área del slide */}
            <div style={{ width: "100%", height: "100%", display: "flex" }}>
              {child}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

Page.displayName = "Page";
