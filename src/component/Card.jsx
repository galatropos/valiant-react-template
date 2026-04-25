// src/component/Card.jsx
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useId,
} from "react";
import { useScale } from "../context/contextScale";
import getPositionWithAnchor from "../utils/getPositionsWithAnchor";
import { useElement } from "../context/ContextElement";
import { useProgresses } from "../hook/useProgresses";

import usePressGlobals from "./cards/usePressGlobals";
import useDraggableCard from "./cards/useDraggableCard";

// === Constantes (solo lectura) ===
import { defaultPercent, ENUM_DEFAULTS } from "./cards/banks";

const Card = forwardRef(function Card(
  {
    backgroundImage = "none",
    portrait = defaultPercent,
    landscape = defaultPercent,
    controlsAnimate = "stop",
    repeat,
    onClick,
    onPointerDown,
    style,
    children,
    id,
    loop,
    setSecuenceFinish,
    className,
    onPointerUp,
    onPointerLeave,

    // Press básicos (NO SE TOCAN)
    onPressStart,
    onPressEndInside,
    onPressEndOutside,
    onPressStartLeave,

    // Press global
    onPressMoveEnter,
    onPressMoveLeave,

    onStepChange,

    // Drag
    draggable = false,
    dragAxis = "both",
    onPressDragStart,
    onPressDrag,
    onPressDragEnd,
    dragDirThresholdPct = 1.5,

    // Tamaños límites
    minWidthPct = 2,
    minHeightPct = -2,
    maxWidthPct = 1000,
    maxHeightPct = 1000,

    // Font size limits && step
    minFontPct = 0.1,
    maxFontPct = 200,
  },
  ref
) {
  const isDraggable = draggable;

  // ID interno (no mutamos el prop id)
  const generatedId = useId();
  const internalId = id || generatedId;

  const {
    width: containerWidth,
    height: containerHeight,
    renderedWidth,
    renderedHeight,
    min: scaleMin,
  } = useScale();

  const [isPortrait, setIsPortrait] = useState(
    typeof window !== "undefined"
      ? window.innerWidth <= window.innerHeight
      : true
  );

  useEffect(() => {
    const onResize = () =>
      setIsPortrait(window.innerWidth <= window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 🔹 Todo directo, sin useMemo
  const modePL = isPortrait ? portrait : landscape;
  const portraitWithDefaults = { ...defaultPercent, ...portrait };
  const landscapeWithDefaults = { ...defaultPercent, ...landscape };
  const baseForHook = isPortrait ? portraitWithDefaults : landscapeWithDefaults;

  const { sequenceValue, stepIndex, stepCount } = useProgresses({
    default: baseForHook,
    animate: modePL?.animate,
    portrait: portraitWithDefaults,
    landscape: landscapeWithDefaults,
    action: controlsAnimate,
    repeat,
    loop,
    onSequenceFinish: () => setSecuenceFinish?.(true),
    onStepChange,
  });

  const referencia123 = useRef(null);
  useImperativeHandle(ref, () => referencia123.current, []);

  // Refs gesto
  const activePointerIdRef = useRef(null);
  const isPressingRef = useRef(false);
  const leftFiredRef = useRef(false);
  const downRectRef = useRef(null);
  const enteredDuringPressRef = useRef(false);
  const endFiredRef = useRef(false);

  // Captura diferida para mouse
  const pendingCaptureRef = useRef(false);
  const captureThresholdPx = 4;

  // Scroll-block para móvil
  const prevTouchActionRef = useRef(null);
  const prevBodyOverscrollRef = useRef(null);
  const prevHtmlOverscrollRef = useRef(null);
  const scrollBlockActiveRef = useRef(false);

  const __preventScrollWhilePressing = (e) => {
    if (isPressingRef.current) {
      try {
        e.preventDefault();
      } catch (_) {}
    }
  };

  const enableGlobalScrollBlock = () => {
    if (scrollBlockActiveRef.current) return;
    scrollBlockActiveRef.current = true;
    try {
      prevBodyOverscrollRef.current =
        document.body.style.overscrollBehavior || "";
      prevHtmlOverscrollRef.current =
        document.documentElement.style.overscrollBehavior || "";
      document.body.style.overscrollBehavior = "none";
      document.documentElement.style.overscrollBehavior = "none";
    } catch (_) {}
    try {
      window.addEventListener("touchmove", __preventScrollWhilePressing, {
        passive: false,
      });
      window.addEventListener("wheel", __preventScrollWhilePressing, {
        passive: false,
      });
    } catch (_) {}
  };

  const disableGlobalScrollBlock = () => {
    if (!scrollBlockActiveRef.current) return;
    scrollBlockActiveRef.current = false;
    try {
      document.body.style.overscrollBehavior =
        prevBodyOverscrollRef.current ?? "";
      document.documentElement.style.overscrollBehavior =
        prevHtmlOverscrollRef.current ?? "";
    } catch (_) {}
    try {
      window.removeEventListener("touchmove", __preventScrollWhilePressing, {
        passive: false,
      });
      window.removeEventListener("wheel", __preventScrollWhilePressing, {
        passive: false,
      });
    } catch (_) {}
  };

  useEffect(() => {
    return () => {
      try {
        disableGlobalScrollBlock();
      } catch (_) {}
    };
  }, []);

  // Global press listeners en hook externo (NO tocar)
  usePressGlobals({
    referencia123,
    activePointerIdRef,
    isPressingRef,
    leftFiredRef,
    downRectRef,
    enteredDuringPressRef,
    endFiredRef,
    onPressMoveEnter,
    onPressMoveLeave,
    onPressEndInside,
    onPressEndOutside,
  });

  // Element registry
  const element = useElement();
  useEffect(() => {
    if (referencia123.current && internalId) {
      element.setElement((prev) => ({
        ...prev,
        [`div_${internalId}`]: {
          ref: referencia123.current,
          portrait,
          landscape,
        },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalId]);

  // Helpers matemáticos
  function clampSigned(v, minAbs = 0.1, maxAbs = 10) {
    if (!Number.isFinite(v)) return minAbs;
    const s = v < 0 ? -1 : 1;
    const abs = Math.min(maxAbs, Math.max(minAbs, Math.abs(v)));
    return s * abs;
  }

  const clamp01 = (val) => Math.min(1, Math.max(0, val));
  const shouldCapturePointer = () => Boolean(isDraggable);
  const getEnumValue = (prop) => ENUM_DEFAULTS[prop];

  // === Wrappers para DRAG con status fijo: start | move | leave ===
  const handleDragStartWithStatus = (info) => {
    const payload = { ...(info || {}), status: "start" };
    onPressDragStart?.(payload);
    onPressDrag?.(payload);
  };
  const handleDragMoveWithStatus = (info) => {
    const payload = { ...(info || {}), status: "move" };
    onPressDrag?.(payload);
  };
  const handleDragEndWithStatus = (info) => {
    const payload = { ...(info || {}), status: "leave" };
    onPressDragEnd?.(payload);
    onPressDrag?.(payload);
  };

  // Drag hook
  const {
    isDragging,
    dragDeltaPct,
    dragBasePct,
    startXYRef,
    handlePointerDownDrag,
    handlePointerMoveDrag,
    commitDragEnd: commitDragEndHook,
  } = useDraggableCard({
    isPortrait,
    isDevMode: false,
    referencia123,
    containerWidth,
    containerHeight,
    renderedWidth,
    renderedHeight,
    scaleMin,
    dragAxis,
    dragDirThresholdPct,
    onPressDragStart: handleDragStartWithStatus,
    onPressDrag: handleDragMoveWithStatus,
    onPressDragEnd: handleDragEndWithStatus,
  });

  // Anim base
  const sv = sequenceValue || {};
  const base = baseForHook;

  const baseScale = base.scale ?? defaultPercent.scale;
  const baseScaleX = base.scaleX ?? defaultPercent.scaleX;
  const baseScaleY = base.scaleY ?? defaultPercent.scaleY;

  const asDeltaOrAbsolute = (val, baseVal) =>
    val == null ? baseVal : Math.abs(val) < 0.1 ? baseVal + val : val;

  const normScale = asDeltaOrAbsolute(sv.scale, baseScale);
  const normScaleX = asDeltaOrAbsolute(sv.scaleX, baseScaleX);
  const normScaleY = asDeltaOrAbsolute(sv.scaleY, baseScaleY);

  const currentBase = {
    ...base,
    ...sv,
    scale: normScale,
    scaleX: normScaleX,
    scaleY: normScaleY,
  };

  // Drag aplicado y medidas
  const dragOffset = {
    x: dragBasePct.x + dragDeltaPct.x,
    y: dragBasePct.y + dragDeltaPct.y,
  };
  const hasMeasures = Boolean(containerWidth && containerHeight);
  const safeW = containerWidth || 1;
  const safeH = containerHeight || 1;

  const unclampedW = currentBase.width;
  const unclampedH = currentBase.height;

  const liveWidthPct = Math.min(maxWidthPct, Math.max(minWidthPct, unclampedW));
  const liveHeightPct = Math.min(
    maxHeightPct,
    Math.max(minHeightPct, unclampedH)
  );

  // ✅ IMPORTANTÍSIMO: redondeo para evitar borde “disparejo”
  const widthPx = Math.round((liveWidthPct / 100) * safeW);
  const heightPx = Math.round((liveHeightPct / 100) * safeH);

  let fontSizePercent =
    typeof currentBase.fontSize === "number"
      ? currentBase.fontSize
      : defaultPercent.fontSize;

  fontSizePercent = Math.min(maxFontPct, Math.max(minFontPct, fontSizePercent));
  const fontSizePx = (fontSizePercent / 100) * safeW;

  const effectiveX = currentBase.x + dragOffset.x;
  const effectiveY = currentBase.y + dragOffset.y;

  const pos = getPositionWithAnchor(
    effectiveX,
    effectiveY,
    widthPx,
    heightPx,
    safeW,
    safeH,
    currentBase.anchor || "left-top"
  );

  // ✅ IMPORTANTÍSIMO: redondeo para evitar borde “disparejo”
  const left = Math.round(pos.left);
  const top = Math.round(pos.top);

  // Clamp visual
  currentBase.scale = Math.min(10, Math.max(0.1, currentBase.scale));
  currentBase.scaleX = clampSigned(currentBase.scaleX);
  currentBase.scaleY = clampSigned(currentBase.scaleY);
  currentBase.opacity = clamp01(currentBase.opacity ?? 1);

  // ✅ Transform SOLO si realmente hace algo (evita raster/aliasing raro)
  const transforms = [];
  const trX = currentBase.translateX ?? 0;
  const trY = currentBase.translateY ?? 0;
  const s = currentBase.scale ?? 1;
  const sx = currentBase.scaleX ?? 1;
  const sy = currentBase.scaleY ?? 1;
  const rZ = currentBase.rotate ?? 0;

  if (trX || trY) transforms.push(`translate(${trX}px, ${trY}px)`);
  if (s !== 1) transforms.push(`scale(${s})`);
  if (sx !== 1) transforms.push(`scaleX(${sx})`);
  if (sy !== 1) transforms.push(`scaleY(${sy})`);
  if (rZ !== 0) transforms.push(`rotate(${rZ}deg)`);

  const computedEnumVals = {
    backgroundRepeat: sv.backgroundRepeat ?? getEnumValue("backgroundRepeat"),
    pointerEvents: sv.pointerEvents ?? getEnumValue("pointerEvents"),
    boxSizing: sv.boxSizing ?? getEnumValue("boxSizing"),
    textAlign: sv.textAlign ?? getEnumValue("textAlign"),
    display: sv.display ?? getEnumValue("display"),
    mixBlendMode: sv.mixBlendMode ?? getEnumValue("mixBlendMode"),
    isolation: sv.isolation ?? getEnumValue("isolation"),
    overflow: sv.overflow ?? getEnumValue("overflow"),
    cursor: sv.cursor ?? getEnumValue("cursor"),
    contain: sv.contain ?? getEnumValue("contain"),
  };

  const hasLineHeightExplicit =
    typeof portrait.lineHeight === "number" ||
    typeof landscape.lineHeight === "number" ||
    typeof sv.lineHeight === "number";

  // ✅ Si el usuario manda style.border, se respeta 100% y no se mezcla nada
  const hasUserBorder =
    typeof style?.border === "string" && style.border.trim().length > 0;

  const cardStyle = {
    position: "absolute",
    width: `${widthPx}px`,
    height: `${heightPx}px`,
    left: `${left}px`,
    top: `${top}px`,

    fontSize: `${fontSizePx}px`,
    letterSpacing: `${
      Number.isFinite(currentBase.letterSpacing) ? currentBase.letterSpacing : 0
    }px`,
    fontWeight: Math.min(
      900,
      Math.max(
        100,
        Number.isFinite(currentBase.fontWeight) ? currentBase.fontWeight : 400
      )
    ),

    display: currentBase.hidden ? "none" : computedEnumVals.display || "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: `${Number.isFinite(currentBase.gap) ? currentBase.gap : 0}px`,

    contain: computedEnumVals.contain || "layout style",
    opacity: currentBase.opacity,

    // ✅ transform solo si hay transform real
    transform: transforms.length ? transforms.join(" ") : undefined,

    willChange: transforms.length
      ? "transform, opacity, filter, backdrop-filter"
      : "opacity, filter, backdrop-filter",

    padding: `${Math.max(
      0,
      Number.isFinite(currentBase.padding) ? currentBase.padding : 0
    )}px`,
    margin: `${Number.isFinite(currentBase.margin) ? currentBase.margin : 0}px`,

    // ✅ Border interno SOLO si el usuario NO mandó style.border
    ...(hasUserBorder
      ? {}
      : {
          borderWidth: `${Math.max(
            0,
            Number.isFinite(currentBase.borderWidth)
              ? currentBase.borderWidth
              : 0
          )}px`,
          borderStyle: "solid",
          borderColor: style?.borderColor || undefined,
        }),

    borderRadius: `${
      Number.isFinite(currentBase.borderRadius) ? currentBase.borderRadius : 0
    }px`,

    // ✅ ayuda a que el borde no “afecte” el box
    boxSizing: "border-box",

    zIndex: Math.round(
      Number.isFinite(currentBase.zIndex) ? currentBase.zIndex : 0
    ),
    overflow: computedEnumVals.overflow,
    pointerEvents: computedEnumVals.pointerEvents,
    cursor: computedEnumVals.cursor,
    touchAction: isDraggable ? "none" : "manipulation",
    WebkitUserSelect: "none",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    visibility: hasMeasures ? undefined : "hidden",
    mixBlendMode: computedEnumVals.mixBlendMode,
    isolation: computedEnumVals.isolation,

    color: sv.color ?? style?.color,
    backgroundColor: sv.backgroundColor || style?.backgroundColor,
    backgroundRepeat:
      computedEnumVals.backgroundRepeat || style?.backgroundRepeat,

    textAlign: style?.textAlign ?? computedEnumVals.textAlign ?? "center",
  };

  if (hasLineHeightExplicit) {
    cardStyle.lineHeight = currentBase.lineHeight;
  }

  // Background image / size / position
  if (sv.background) {
    cardStyle.background = sv.background;
    delete cardStyle.backgroundRepeat;
  } else {
    if (sv.backgroundImage) {
      cardStyle.backgroundImage = sv.backgroundImage;
    } else if (backgroundImage && backgroundImage !== "none") {
      cardStyle.backgroundImage = `url(${backgroundImage})`;
    } else {
      cardStyle.backgroundImage = "none";
    }

    const bgPosX = Math.min(
      1000,
      Math.max(
        -1000,
        Number.isFinite(currentBase.backgroundPositionX)
          ? currentBase.backgroundPositionX
          : 50
      )
    );
    const bgPosY = Math.min(
      1000,
      Math.max(
        -1000,
        Number.isFinite(currentBase.backgroundPositionY)
          ? currentBase.backgroundPositionY
          : 50
      )
    );

    cardStyle.backgroundPosition =
      sv.backgroundPosition || `${bgPosX}% ${bgPosY}%`;

    const enumBgSize = getEnumValue("backgroundSize");
    const bgSizeFromProp = currentBase.backgroundSize;
    const bgSizeFromSV = sv.backgroundSize;

    let bgSizePreset;
    if (bgSizeFromSV != null) bgSizePreset = bgSizeFromSV;
    else if (bgSizeFromProp != null) bgSizePreset = bgSizeFromProp;
    else bgSizePreset = enumBgSize;

    if (bgSizePreset) cardStyle.backgroundSize = bgSizePreset;
  }

  const handlePointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    activePointerIdRef.current = e.pointerId;
    isPressingRef.current = true;
    leftFiredRef.current = false;
    enteredDuringPressRef.current = true;
    downRectRef.current = referencia123.current?.getBoundingClientRect() ?? null;
    endFiredRef.current = false;

    if (isDraggable) {
      handlePointerDownDrag(e, currentBase, false);

      if (e.pointerType !== "mouse") {
        if (shouldCapturePointer()) {
          try {
            referencia123.current?.setPointerCapture?.(e.pointerId);
          } catch (_) {}
        }
      } else {
        pendingCaptureRef.current = shouldCapturePointer();
      }

      try {
        prevTouchActionRef.current =
          referencia123.current?.style?.touchAction || "";
        if (e.pointerType !== "mouse" && referencia123.current) {
          referencia123.current.style.touchAction = "none";
        }
      } catch (_) {}

      if (e.pointerType !== "mouse") enableGlobalScrollBlock();

      onPressStart?.(e);
      onPointerDown?.(e);
      return;
    }

    if (e.pointerType !== "mouse") {
      if (shouldCapturePointer()) {
        try {
          referencia123.current?.setPointerCapture?.(e.pointerId);
        } catch (_) {}
      }
    } else {
      pendingCaptureRef.current = shouldCapturePointer();
    }

    try {
      prevTouchActionRef.current =
        referencia123.current?.style?.touchAction || "";
      if (e.pointerType !== "mouse" && referencia123.current) {
        referencia123.current.style.touchAction = "none";
      }
    } catch (_) {}

    if (e.pointerType !== "mouse") enableGlobalScrollBlock();

    onPressStart?.(e);
    onPointerDown?.(e);
  };

  const handlePointerMoveLocal = (e) => {
    if (
      e.pointerType === "mouse" &&
      pendingCaptureRef.current &&
      shouldCapturePointer()
    ) {
      const dx = e.clientX - (startXYRef.current?.x ?? e.clientX);
      const dy = e.clientY - (startXYRef.current?.y ?? e.clientY);
      if (Math.hypot(dx, dy) >= captureThresholdPx) {
        try {
          referencia123.current?.setPointerCapture?.(e.pointerId);
        } catch (_) {}
        pendingCaptureRef.current = false;
      }
    }

    if (!isPressingRef.current || activePointerIdRef.current !== e.pointerId)
      return;

    const rect =
      downRectRef.current || referencia123.current?.getBoundingClientRect();
    if (!rect) return;

    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!inside && !leftFiredRef.current) {
      leftFiredRef.current = true;
      onPressStartLeave?.(e);
      if (enteredDuringPressRef.current) {
        enteredDuringPressRef.current = false;
        onPressMoveLeave?.(e);
      }
    } else if (
      inside &&
      leftFiredRef.current &&
      !enteredDuringPressRef.current
    ) {
      enteredDuringPressRef.current = true;
      onPressMoveEnter?.(e);
    }

    if (isDraggable && isDragging) {
      handlePointerMoveDrag(e, currentBase, false);
      return;
    }
  };

  const commitDragEnd = (e) => {
    commitDragEndHook(e, currentBase, false);
  };

  const handlePointerUp = (e) => {
    disableGlobalScrollBlock();
    try {
      if (referencia123.current) {
        if (prevTouchActionRef.current != null) {
          referencia123.current.style.touchAction = prevTouchActionRef.current;
        } else {
          referencia123.current.style.touchAction = isDraggable
            ? "none"
            : "manipulation";
        }
      }
    } catch (_) {}

    onPointerUp?.(e);

    if (isDraggable && isDragging) {
      commitDragEnd(e);
    }

    try {
      if (!endFiredRef.current) {
        const rect =
          downRectRef.current || referencia123.current?.getBoundingClientRect();
        if (rect) {
          const inside =
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom;
          if (inside) onPressEndInside?.(e);
          else onPressEndOutside?.(e);
          endFiredRef.current = true;
        }
      }
    } catch (_) {}

    try {
      referencia123.current?.releasePointerCapture?.(e.pointerId);
    } catch (_) {}

    activePointerIdRef.current = null;
    isPressingRef.current = false;
    leftFiredRef.current = false;
    enteredDuringPressRef.current = false;
    downRectRef.current = null;
    endFiredRef.current = false;
    pendingCaptureRef.current = false;
  };

  const handlePointerCancel = (e) => {
    disableGlobalScrollBlock();
    try {
      if (referencia123.current) {
        if (prevTouchActionRef.current != null) {
          referencia123.current.style.touchAction = prevTouchActionRef.current;
        } else {
          referencia123.current.style.touchAction = isDraggable
            ? "none"
            : "manipulation";
        }
      }
    } catch (_) {}

    if (isDraggable && isDragging) {
      commitDragEnd(e);
    }

    try {
      referencia123.current?.releasePointerCapture?.(e.pointerId);
    } catch (_) {}

    activePointerIdRef.current = null;
    isPressingRef.current = false;
    leftFiredRef.current = false;
    enteredDuringPressRef.current = false;
    downRectRef.current = null;
    endFiredRef.current = false;
    pendingCaptureRef.current = false;
  };

  return (
    <span
      onFocus={() => {}}
      onBlur={() => {}}
      onPointerEnter={() => {}}
      onPointerLeave={(e) => {
        if (!isPressingRef.current && referencia123.current) {
          referencia123.current.style.cursor = "";
        }
        onPointerLeave?.(e);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMoveLocal}
      onPointerUp={handlePointerUp}
      onClick={(e) => {
        onClick?.(e);
      }}
      onPointerCancel={handlePointerCancel}
      ref={referencia123}
      id={internalId}
      style={{ ...cardStyle, ...style }}
      className={className}
      data-anim-step={stepIndex}
      data-anim-steps={stepCount}
    >
      {children}
    </span>
  );
});

export default Card;
