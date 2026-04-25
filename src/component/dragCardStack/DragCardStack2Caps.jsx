// src/component/dragCardStack/DragCardStack2Caps.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import './DragCardStack.css';

const DEFAULT_CARDS = [
  {
    id: 1,
    element: (
      <div className="drag-card-stack-text-card">
        <h2>Carta 1</h2>
        <p>Contenido editable</p>
      </div>
    ),
  },
  {
    id: 2,
    element: (
      <div className="drag-card-stack-text-card">
        <h2>Carta 2</h2>
        <p>Contenido editable</p>
      </div>
    ),
  },
];

function mod(n, m) {
  return ((n % m) + m) % m;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function buildInterpolatedState(current, target, t) {
  return {
    x: Math.round(lerp(current.x, target.x, t)),
    y: Math.round(lerp(current.y, target.y, t)),
    scale: lerp(current.scale, target.scale, t),
    opacity: lerp(current.opacity, target.opacity, t),
    brightness: lerp(current.brightness, target.brightness, t),
  };
}

function resolveSize(value) {
  return typeof value === 'number' ? `${value}px` : value;
}

function getPhaseZ(offset) {
  if (offset === 0) return 2;
  if (offset === 1) return 1;
  return 0;
}

export default function DragCardStack2Caps({
  cards = DEFAULT_CARDS,
  autoPlay = true,
  autoPlayDelay = 2200,
  stepSize = 140,
  dragSensitivity = 1,
  snapThreshold = 0.35,
  showOverlay = true,
  className = '',
  onChange,
  onPressEnter,
  onPressLeave,
  pressThreshold = 8,
  width = '100%',
  height = '100%',
  cardWidthRatio = 0.43,
  cardAspectRatio = 300 / 425,
  frontScale = 1,
  sideScale = 0.9,
  sideOpacity = 0.88,
  sideBrightness = 0.84,
  sideXRatio = 0.36,
  sideYRatio = -0.018,
  borderRadius = 8,
  shadow = '0 20px 40px rgba(0, 0, 0, 0.35)',
  dragTransition = 'transform 0ms linear, opacity 120ms linear, filter 120ms linear',
  idleTransition = 'transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms cubic-bezier(0.22,1,0.36,1), filter 700ms cubic-bezier(0.22,1,0.36,1)',
  activeIndex,
  previewActiveIndex,
  previewProgressValue,
  onActiveIndexChange,
  onPreviewChange,
  interactive = true,
}) {
  const normalizedCards = useMemo(() => cards.slice(0, 2), [cards]);
  const total = normalizedCards.length;

  const intervalRef = useRef(null);
  const containerRef = useRef(null);
  const dragRafRef = useRef(null);
  const pendingPreviewRef = useRef(null);

  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    dragX: 0,
    dragY: 0,
    moved: false,
  });

  const isControlledActive = typeof activeIndex === 'number';
  const isControlledPreviewActive = typeof previewActiveIndex === 'number';
  const isControlledPreviewProgress = typeof previewProgressValue === 'number';

  const [internalActive, setInternalActive] = useState(0);
  const [internalPreviewActive, setInternalPreviewActive] = useState(0);
  const [internalPreviewProgress, setInternalPreviewProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [stackSize, setStackSize] = useState({ width: 300, height: 430 });

  const active = isControlledActive ? activeIndex : internalActive;
  const previewActive = isControlledPreviewActive ? previewActiveIndex : internalPreviewActive;
  const previewProgress = isControlledPreviewProgress
    ? previewProgressValue
    : internalPreviewProgress;

  const safeSensitivity = dragSensitivity > 0 ? dragSensitivity : 1;
  const safeSnapThreshold = Math.max(0, Math.min(snapThreshold, 1));
  const safePressThreshold = Math.max(0, pressThreshold);
  const effectiveStepSize = stepSize / safeSensitivity;

  const setActiveValue = (valueOrFn) => {
    const nextValue =
      typeof valueOrFn === 'function' ? valueOrFn(active) : valueOrFn;

    if (!isControlledActive) {
      setInternalActive(nextValue);
    }

    if (typeof onActiveIndexChange === 'function') {
      onActiveIndexChange(nextValue);
    }

    if (typeof onChange === 'function') {
      onChange(nextValue);
    }
  };

  const setPreviewValue = ({ nextPreviewActive, nextPreviewProgress }) => {
    if (!isControlledPreviewActive) {
      setInternalPreviewActive(nextPreviewActive);
    }

    if (!isControlledPreviewProgress) {
      setInternalPreviewProgress(nextPreviewProgress);
    }

    if (typeof onPreviewChange === 'function') {
      onPreviewChange({
        previewActive: nextPreviewActive,
        previewProgress: nextPreviewProgress,
      });
    }
  };

  const states = useMemo(() => {
    const widthValue = stackSize.width;
    const heightValue = stackSize.height;

    return [
      {
        x: 0,
        y: 0,
        scale: frontScale,
        opacity: 1,
        brightness: 1,
      },
      {
        x: widthValue * sideXRatio,
        y: heightValue * sideYRatio,
        scale: sideScale,
        opacity: sideOpacity,
        brightness: sideBrightness,
      },
    ];
  }, [
    stackSize.width,
    stackSize.height,
    frontScale,
    sideScale,
    sideOpacity,
    sideBrightness,
    sideXRatio,
    sideYRatio,
  ]);

  const visibleStates = useMemo(() => {
    return normalizedCards.map((_, index) => {
      const baseIndex = mod(previewActive, total || 1);
      const offset = mod(index - baseIndex, total || 1);
      const current = states[offset];

      if (!current) return null;

      if (previewProgress === 0) {
        return {
          ...current,
          z: getPhaseZ(offset),
        };
      }

      const direction = previewProgress > 0 ? 1 : -1;
      const t = Math.min(Math.abs(previewProgress), 1);
      const targetOffset =
        direction > 0 ? mod(offset - 1, total || 1) : mod(offset + 1, total || 1);
      const target = states[targetOffset];

      if (!target) {
        return {
          ...current,
          z: getPhaseZ(offset),
        };
      }

      const interpolated = buildInterpolatedState(current, target, t);

      return {
        ...interpolated,
        z: getPhaseZ(offset),
      };
    });
  }, [normalizedCards, previewActive, previewProgress, states, total]);

  useEffect(() => {
    setPreviewValue({
      nextPreviewActive: active,
      nextPreviewProgress: 0,
    });
  }, [active]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateSize = () => {
      const parentWidth = node.clientWidth;
      const parentHeight = node.clientHeight;

      if (!parentWidth || !parentHeight) return;

      const nextWidth = parentWidth * cardWidthRatio;
      const nextHeightByWidth = nextWidth / cardAspectRatio;
      const maxHeight = parentHeight * 0.82;

      let finalWidth = nextWidth;
      let finalHeight = nextHeightByWidth;

      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = finalHeight * cardAspectRatio;
      }

      setStackSize({
        width: finalWidth,
        height: finalHeight,
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [cardAspectRatio, cardWidthRatio, width, height]);

  useEffect(() => {
    if (!autoPlay || isDragging || total <= 1 || isControlledActive) return;

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveValue((prev) => mod(prev + 1, total));
    }, autoPlayDelay);

    return () => clearInterval(intervalRef.current);
  }, [autoPlay, autoPlayDelay, isDragging, total, isControlledActive]);

  useEffect(() => {
    function flushPreviewFrame() {
      dragRafRef.current = null;

      if (!pendingPreviewRef.current) return;

      const { nextPreviewActive, nextPreviewProgress } = pendingPreviewRef.current;

      setPreviewValue({
        nextPreviewActive,
        nextPreviewProgress,
      });
    }

    function handlePointerMove(e) {
      const drag = dragRef.current;
      if (!interactive || !drag.isDragging || total <= 1) return;

      drag.dragX = e.clientX - drag.startX;
      drag.dragY = e.clientY - drag.startY;

      if (
        !drag.moved &&
        (Math.abs(drag.dragX) > safePressThreshold ||
          Math.abs(drag.dragY) > safePressThreshold)
      ) {
        drag.moved = true;
      }

      const rawProgress = drag.dragX / effectiveStepSize;
      const wholeSteps = rawProgress > 0 ? Math.floor(rawProgress) : Math.ceil(rawProgress);
      const remainder = rawProgress - wholeSteps;
      const nextPreviewActive = mod(active - wholeSteps, total);
      const nextPreviewProgress = -remainder;

      pendingPreviewRef.current = {
        nextPreviewActive,
        nextPreviewProgress,
      };

      if (!dragRafRef.current) {
        dragRafRef.current = requestAnimationFrame(flushPreviewFrame);
      }
    }

    function handlePointerUp(e) {
      const drag = dragRef.current;
      if (!interactive || !drag.isDragging || total <= 1) return;

      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }

      pendingPreviewRef.current = null;

      drag.isDragging = false;
      setIsDragging(false);

      const rawProgress = drag.dragX / effectiveStepSize;
      const wholeSteps = rawProgress > 0 ? Math.floor(rawProgress) : Math.ceil(rawProgress);
      const remainder = rawProgress - wholeSteps;

      let stepAdjustment = 0;

      if (Math.abs(remainder) >= safeSnapThreshold) {
        stepAdjustment = remainder > 0 ? 1 : -1;
      }

      const finalActive = mod(active - wholeSteps - stepAdjustment, total);

      setActiveValue(finalActive);
      setPreviewValue({
        nextPreviewActive: finalActive,
        nextPreviewProgress: 0,
      });

      if (!drag.moved && typeof onPressLeave === 'function') {
        onPressLeave({
          activeIndex: finalActive,
          pointerType: e.pointerType,
          clientX: e.clientX,
          clientY: e.clientY,
        });
      }

      drag.dragX = 0;
      drag.dragY = 0;
      drag.moved = false;
    }

    function handlePointerCancel() {
      const drag = dragRef.current;
      if (!drag.isDragging) return;

      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }

      pendingPreviewRef.current = null;

      drag.isDragging = false;
      setIsDragging(false);

      setPreviewValue({
        nextPreviewActive: active,
        nextPreviewProgress: 0,
      });

      drag.dragX = 0;
      drag.dragY = 0;
      drag.moved = false;
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);

      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }

      pendingPreviewRef.current = null;
    };
  }, [
    active,
    effectiveStepSize,
    interactive,
    onPressLeave,
    safePressThreshold,
    safeSnapThreshold,
    total,
  ]);

  const handlePointerDown = (e) => {
    if (!interactive || total <= 1) return;

    clearInterval(intervalRef.current);

    if (dragRafRef.current) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }

    pendingPreviewRef.current = null;

    dragRef.current.isDragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.dragX = 0;
    dragRef.current.dragY = 0;
    dragRef.current.moved = false;

    setIsDragging(true);

    if (typeof onPressEnter === 'function') {
      onPressEnter({
        activeIndex: active,
        pointerType: e.pointerType,
        clientX: e.clientX,
        clientY: e.clientY,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`drag-card-stack-page ${className}`}
      style={{
        width: resolveSize(width),
        height: resolveSize(height),
      }}
    >
      <div className="drag-card-stack-scene">
        <div className="drag-card-stack-wrapper">
          <div
            className={`drag-card-stack ${isDragging ? 'drag-card-stack--dragging' : ''}`}
            onPointerDown={handlePointerDown}
            style={{
              width: `${stackSize.width}px`,
              height: `${stackSize.height}px`,
            }}
          >
            {normalizedCards.map((card, index) => {
              const state = visibleStates[index];
              if (!state) return null;

              return (
                <div
                  key={card.id ?? index}
                  className="drag-card-stack-card"
                  style={{
                    transform: `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`,
                    opacity: state.opacity,
                    filter: `brightness(${state.brightness})`,
                    zIndex: state.z,
                    transition: isDragging ? dragTransition : idleTransition,
                    borderRadius,
                    boxShadow: shadow,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transformOrigin: 'center center',
                  }}
                >
                  <div className="drag-card-stack-content">{card.element}</div>
                  {showOverlay && <div className="drag-card-stack-overlay" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}