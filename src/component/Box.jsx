// src/component/Box.jsx
import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useId,
} from "react";
import { useScale } from "../context/contextScale";
import getPositionWithAnchor from "../utils/getPositionsWithAnchor";

import usePressGlobals from "./cards/usePressGlobals";
import useDraggableCard from "./cards/useDraggableCard";

// === Constantes (solo lectura) ===
import { defaultPercent, ENUM_DEFAULTS } from "./cards/banks";

const Box = forwardRef(function Box(
  {
    backgroundImage = "none",
    portrait = defaultPercent,
    landscape = defaultPercent,
    onClick,
    onPointerDown,
    style,
    children,
    id,
    className,
    onPointerUp,
    onPointerLeave,

    // ✅ Props para atributos extra (data-*, aria-*, etc.)
    attribute,
    atributes,
    atribute,

    // Press básicos (NO SE TOCAN)
    onPressStart,
    onPressEndInside,
    onPressEndOutside,
    onPressStartLeave,

    // Press global
    onPressMoveEnter,
    onPressMoveLeave,

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

    // Font size limits
    minFontPct = 0.1,
    maxFontPct = 200,
  },
  ref,
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

  // ✅ Sin useEffect/useState: inferimos orientación por el tamaño renderizado
  const wForOrientation = renderedWidth || containerWidth || 1;
  const hForOrientation = renderedHeight || containerHeight || 1;
  const isPortrait = wForOrientation <= hForOrientation;

  // 🔹 Defaults
  const portraitWithDefaults = { ...defaultPercent, ...portrait };
  const landscapeWithDefaults = { ...defaultPercent, ...landscape };

  // ✅ QUITAR opacity de portrait/landscape (y de defaultPercent si viene)
  const { opacity: _pOpacity, ...portraitNoOpacity } = portraitWithDefaults;
  const { opacity: _lOpacity, ...landscapeNoOpacity } = landscapeWithDefaults;

  const baseForHook = isPortrait ? portraitNoOpacity : landscapeNoOpacity;

  // ✅ Renombrado: referencia123 -> refBoxCore
  const refBoxCore = useRef(null);
  useImperativeHandle(ref, () => refBoxCore.current, []);

  // ✅ Normaliza attribute/atributes/atribute a un objeto para hacer spread en el <span />
  const buildExtraAttrs = (input) => {
    if (!input) return undefined;

    // Caso 1: ["data-table", "3"] (1 par)
    if (
      Array.isArray(input) &&
      typeof input[0] === "string" &&
      input.length === 2
    ) {
      return { [input[0]]: input[1] };
    }

    // Caso 1.1: ["data-a", 1, "data-b", 2, ...] (array plano por pares)
    if (
      Array.isArray(input) &&
      typeof input[0] === "string" &&
      input.length > 2
    ) {
      const out = {};
      if (input.length % 2 === 0) {
        for (let i = 0; i < input.length; i += 2) {
          const k = input[i];
          const v = input[i + 1];
          if (typeof k === "string") out[k] = v;
        }
        return out;
      }
    }

    // Caso 2: [["data-a", 1], ["aria-label", "x"]]
    if (Array.isArray(input) && Array.isArray(input[0])) {
      const out = {};
      for (const pair of input) {
        if (!Array.isArray(pair) || typeof pair[0] !== "string") continue;
        out[pair[0]] = pair[1];
      }
      return out;
    }

    // Caso 3: { "data-table": "3", "aria-label": "..." }
    if (typeof input === "object") return input;

    return undefined;
  };

  // ✅ Prioridad: attribute (nuevo) -> atributes -> atribute
  const extraAttrs = buildExtraAttrs(attribute ?? atributes ?? atribute);

  // Refs gesto
  const activePointerIdRef = useRef(null);
  const isPressingRef = useRef(false);
  const leftFiredRef = useRef(false);
  const downRectRef = useRef(null);
  const enteredDuringPressRef = useRef(false);
  const endFiredRef = useRef(false);

  // ✅ dragPress fase para no spamear
  const dragPressPhaseRef = useRef("idle"); // "idle" | "start" | "move"

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

  // Global press listeners en hook externo (NO tocar)
  usePressGlobals({
    referencia123: refBoxCore, // ✅ mantenemos la key que espera el hook
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

  // Helpers matemáticos
  function clampSigned(v, minAbs = 0.1, maxAbs = 10) {
    if (!Number.isFinite(v)) return minAbs;
    const sgn = v < 0 ? -1 : 1;
    const abs = Math.min(maxAbs, Math.max(minAbs, Math.abs(v)));
    return sgn * abs;
  }

  const getEnumValue = (prop) => ENUM_DEFAULTS[prop];

  // ✅ construir elements desde el punto del cursor
  const getElementsFromEvent = (ev) => {
    const e = ev?.nativeEvent ?? ev;
    const x = e?.clientX;
    const y = e?.clientY;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
    try {
      return document.elementsFromPoint(x, y) || [];
    } catch (_) {
      return [];
    }
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
    resetDragBase,
  } = useDraggableCard({
    isPortrait,
    isDevMode: false,
    myDiv: refBoxCore, // ✅ tu hook usa myDiv
    containerWidth,
    containerHeight,
    renderedWidth,
    renderedHeight,
    scaleMin,
    dragAxis,
    dragDirThresholdPct,

    onPressDragStart: (info) => {
      onPressDragStart?.({
        ...(info || {}),
        resetDragBase,
        currentTarget: refBoxCore.current,
      });
    },

    onPressDrag: (info) => {
      const ev = info?.event ?? info?.e ?? info?.evt ?? info?.nativeEvent;
      const elements = info?.elements ?? getElementsFromEvent(ev);

      onPressDrag?.({
        ...(info || {}),
        elements,
        resetDragBase,
        currentTarget: refBoxCore.current,
      });
    },

    onPressDragEnd: (info) => {
      onPressDragEnd?.({
        ...(info || {}),
        resetDragBase,
        currentTarget: refBoxCore.current,
      });
    },
  });

  // emitir dragPress (start/move/leave) por tu callback global
  const emitDragPress = (status, ev) => {
    if (!isDraggable) return;
    const elements = getElementsFromEvent(ev);
    onPressDrag?.({
      status, // "start" | "move" | "leave"
      event: ev,
      elements,
      resetDragBase,
      currentTarget: refBoxCore.current,
      isDragging,
    });
  };

  // ✅ SIN ANIMATION: todo sale directo de baseForHook
  const currentBase = { ...baseForHook };

  // Drag aplicado y medidas
  const dragOffset = {
    x: dragBasePct.x + dragDeltaPct.x,
    y: dragBasePct.y + dragDeltaPct.y,
  };

  const hasMeasures = Boolean(containerWidth && containerHeight);
  const safeW = containerWidth || 1;
  const safeH = containerHeight || 1;

  const liveWidthPct = Math.min(
    maxWidthPct,
    Math.max(minWidthPct, currentBase.width),
  );
  const liveHeightPct = Math.min(
    maxHeightPct,
    Math.max(minHeightPct, currentBase.height),
  );

  const widthPx = Math.round((liveWidthPct / 100) * safeW);
  const heightPx = Math.round((liveHeightPct / 100) * safeH);

  let fontSizePercent =
    typeof currentBase.fontSize === "number"
      ? currentBase.fontSize
      : defaultPercent.fontSize;

  fontSizePercent = Math.min(maxFontPct, Math.max(minFontPct, fontSizePercent));
  const fontSizePx = (fontSizePercent / 100) * safeW;

  // ✅ Drag SIEMPRE por x/y (left/top)
  const effectiveX = currentBase.x + dragOffset.x;
  const effectiveY = currentBase.y + dragOffset.y;

  const pos = getPositionWithAnchor(
    effectiveX,
    effectiveY,
    widthPx,
    heightPx,
    safeW,
    safeH,
    currentBase.anchor || "left-top",
  );

  const left = Math.round(pos.left);
  const top = Math.round(pos.top);

  // Clamp visual
  currentBase.scale = Math.min(10, Math.max(0.1, currentBase.scale ?? 1));
  currentBase.scaleX = clampSigned(currentBase.scaleX ?? 1);
  currentBase.scaleY = clampSigned(currentBase.scaleY ?? 1);

  // ✅ TRANSFORM: sin translate
  const transforms = [];
  const s = currentBase.scale ?? 1;
  const sx = currentBase.scaleX ?? 1;
  const sy = currentBase.scaleY ?? 1;
  const rZ = currentBase.rotate ?? 0;

  if (s !== 1) transforms.push(`scale(${s})`);
  if (sx !== 1) transforms.push(`scaleX(${sx})`);
  if (sy !== 1) transforms.push(`scaleY(${sy})`);
  if (rZ !== 0) transforms.push(`rotate(${rZ}deg)`);

  const computedEnumVals = {
    backgroundRepeat:
      currentBase.backgroundRepeat ?? getEnumValue("backgroundRepeat"),
    pointerEvents: currentBase.pointerEvents ?? getEnumValue("pointerEvents"),
    textAlign: currentBase.textAlign ?? getEnumValue("textAlign"),
    display: currentBase.display ?? getEnumValue("display"),
    mixBlendMode: currentBase.mixBlendMode ?? getEnumValue("mixBlendMode"),
    isolation: currentBase.isolation ?? getEnumValue("isolation"),
    overflow: currentBase.overflow ?? getEnumValue("overflow"),
    cursor: currentBase.cursor ?? getEnumValue("cursor"),
    contain: currentBase.contain ?? getEnumValue("contain"),
  };

  const hasLineHeightExplicit =
    typeof portrait.lineHeight === "number" ||
    typeof landscape.lineHeight === "number" ||
    typeof currentBase.lineHeight === "number";

  const hasUserBorder =
    typeof style?.border === "string" && style.border.trim().length > 0;

  const boxStyle = {
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
        Number.isFinite(currentBase.fontWeight) ? currentBase.fontWeight : 400,
      ),
    ),

    display: currentBase.hidden ? "none" : computedEnumVals.display || "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: `${Number.isFinite(currentBase.gap) ? currentBase.gap : 0}px`,
    contain: computedEnumVals.contain || "layout style",

    transform: transforms.length ? transforms.join(" ") : undefined,

    willChange: transforms.length
      ? "transform, filter, backdrop-filter"
      : "filter, backdrop-filter",

    padding: `${Math.max(
      0,
      Number.isFinite(currentBase.padding) ? currentBase.padding : 0,
    )}px`,
    margin: `${Number.isFinite(currentBase.margin) ? currentBase.margin : 0}px`,

    ...(hasUserBorder
      ? {}
      : {
          borderWidth: `${Math.max(
            0,
            Number.isFinite(currentBase.borderWidth)
              ? currentBase.borderWidth
              : 0,
          )}px`,
          borderStyle: "solid",
          borderColor: style?.borderColor || undefined,
        }),

    borderRadius: `${
      Number.isFinite(currentBase.borderRadius) ? currentBase.borderRadius : 0
    }px`,

    boxSizing: "border-box",

    zIndex: Math.round(
      Number.isFinite(currentBase.zIndex) ? currentBase.zIndex : 0,
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

    color: currentBase.color ?? style?.color,
    backgroundColor: currentBase.backgroundColor || style?.backgroundColor,
    backgroundRepeat:
      computedEnumVals.backgroundRepeat || style?.backgroundRepeat,

    textAlign: style?.textAlign ?? computedEnumVals.textAlign ?? "center",
  };

  if (hasLineHeightExplicit) {
    boxStyle.lineHeight = currentBase.lineHeight;
  }

  // Background image / size / position
  if (currentBase.background) {
    boxStyle.background = currentBase.background;
    delete boxStyle.backgroundRepeat;
  } else {
    if (currentBase.backgroundImage) {
      boxStyle.backgroundImage = currentBase.backgroundImage;
    } else if (backgroundImage && backgroundImage !== "none") {
      boxStyle.backgroundImage = `url(${backgroundImage})`;
    } else {
      boxStyle.backgroundImage = "none";
    }

    const bgPosX = Math.min(
      1000,
      Math.max(
        -1000,
        Number.isFinite(currentBase.backgroundPositionX)
          ? currentBase.backgroundPositionX
          : 50,
      ),
    );
    const bgPosY = Math.min(
      1000,
      Math.max(
        -1000,
        Number.isFinite(currentBase.backgroundPositionY)
          ? currentBase.backgroundPositionY
          : 50,
      ),
    );

    boxStyle.backgroundPosition =
      currentBase.backgroundPosition || `${bgPosX}% ${bgPosY}%`;

    const enumBgSize = getEnumValue("backgroundSize");
    const bgSizeFromProp = currentBase.backgroundSize;

    const bgSizePreset = bgSizeFromProp != null ? bgSizeFromProp : enumBgSize;
    if (bgSizePreset) boxStyle.backgroundSize = bgSizePreset;
  }

  const handlePointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    activePointerIdRef.current = e.pointerId;
    isPressingRef.current = true;
    leftFiredRef.current = false;
    enteredDuringPressRef.current = true;
    downRectRef.current = refBoxCore.current?.getBoundingClientRect() ?? null;
    endFiredRef.current = false;

    // start por onPressDrag (para tu sistema)
    if (isDraggable) {
      dragPressPhaseRef.current = "start";
      emitDragPress("start", e);
    }

    if (isDraggable) {
      handlePointerDownDrag(e, currentBase, false);

      // ✅ ARREGLO: CAPTURE INMEDIATO también en mouse (para no perder moves)
      try {
        refBoxCore.current?.setPointerCapture?.(e.pointerId);
      } catch (_) {}

      // ✅ ya no dependemos de pendingCapture para draggable
      pendingCaptureRef.current = false;

      try {
        prevTouchActionRef.current =
          refBoxCore.current?.style?.touchAction || "";
        if (refBoxCore.current) {
          refBoxCore.current.style.touchAction = "none";
        }
      } catch (_) {}

      if (e.pointerType !== "mouse") enableGlobalScrollBlock();

      onPressStart?.(e);
      onPointerDown?.(e);
      return;
    }

    // no draggable (igual que antes)
    if (e.pointerType !== "mouse") {
      try {
        refBoxCore.current?.setPointerCapture?.(e.pointerId);
      } catch (_) {}
    } else {
      pendingCaptureRef.current = true;
    }

    try {
      prevTouchActionRef.current =
        refBoxCore.current?.style?.touchAction || "";
      if (e.pointerType !== "mouse" && refBoxCore.current) {
        refBoxCore.current.style.touchAction = "none";
      }
    } catch (_) {}

    if (e.pointerType !== "mouse") enableGlobalScrollBlock();

    onPressStart?.(e);
    onPointerDown?.(e);
  };

  const handlePointerMoveLocal = (e) => {
    // pending capture SOLO para no draggable
    if (!isDraggable && e.pointerType === "mouse" && pendingCaptureRef.current) {
      const dx = e.clientX - (startXYRef.current?.x ?? e.clientX);
      const dy = e.clientY - (startXYRef.current?.y ?? e.clientY);
      if (Math.hypot(dx, dy) >= captureThresholdPx) {
        try {
          refBoxCore.current?.setPointerCapture?.(e.pointerId);
        } catch (_) {}
        pendingCaptureRef.current = false;
      }
    }

    if (!isPressingRef.current || activePointerIdRef.current !== e.pointerId)
      return;

    const rect =
      downRectRef.current || refBoxCore.current?.getBoundingClientRect();
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

    if (isDraggable && dragPressPhaseRef.current !== "move") {
      dragPressPhaseRef.current = "move";
      emitDragPress("move", e);
    }

    // ✅ ARREGLO: para draggable, mueve SIEMPRE (ya no dependas de isDragging state)
    if (isDraggable) {
      handlePointerMoveDrag(e, currentBase, false);
    }
  };

  const commitDragEnd = (e) => {
    commitDragEndHook(e, currentBase, false);
  };

  const finishDragPressLeave = (e) => {
    if (!isDraggable) return;
    if (dragPressPhaseRef.current !== "idle") {
      dragPressPhaseRef.current = "idle";
      emitDragPress("leave", e);
    }
  };

  const handlePointerUp = (e) => {
    disableGlobalScrollBlock();

    try {
      if (refBoxCore.current) {
        if (prevTouchActionRef.current != null) {
          refBoxCore.current.style.touchAction = prevTouchActionRef.current;
        } else {
          refBoxCore.current.style.touchAction = isDraggable
            ? "none"
            : "manipulation";
        }
      }
    } catch (_) {}

    onPointerUp?.(e);

    if (isDraggable) {
      commitDragEnd(e);
    }

    finishDragPressLeave(e);

    try {
      if (!endFiredRef.current) {
        const rect =
          downRectRef.current || refBoxCore.current?.getBoundingClientRect();
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
      refBoxCore.current?.releasePointerCapture?.(e.pointerId);
    } catch (_) {}

    activePointerIdRef.current = null;
    isPressingRef.current = false;
    leftFiredRef.current = false;
    enteredDuringPressRef.current = false;
    downRectRef.current = null;
    endFiredRef.current = false;
    pendingCaptureRef.current = false;
    dragPressPhaseRef.current = "idle";
  };

  const handlePointerCancel = (e) => {
    disableGlobalScrollBlock();

    try {
      if (refBoxCore.current) {
        if (prevTouchActionRef.current != null) {
          refBoxCore.current.style.touchAction = prevTouchActionRef.current;
        } else {
          refBoxCore.current.style.touchAction = isDraggable
            ? "none"
            : "manipulation";
        }
      }
    } catch (_) {}

    if (isDraggable) {
      commitDragEnd(e);
    }

    finishDragPressLeave(e);

    try {
      refBoxCore.current?.releasePointerCapture?.(e.pointerId);
    } catch (_) {}

    activePointerIdRef.current = null;
    isPressingRef.current = false;
    leftFiredRef.current = false;
    enteredDuringPressRef.current = false;
    downRectRef.current = null;
    endFiredRef.current = false;
    pendingCaptureRef.current = false;
    dragPressPhaseRef.current = "idle";
  };

  return (
    <span
      {...extraAttrs}
      onPointerLeave={(e) => {
        if (!isPressingRef.current && refBoxCore.current) {
          refBoxCore.current.style.cursor = "";
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
      ref={refBoxCore}
      id={internalId}
      style={{ ...boxStyle, ...style }}
      className={className}
    >
      {children}
    </span>
  );
});

export default Box;