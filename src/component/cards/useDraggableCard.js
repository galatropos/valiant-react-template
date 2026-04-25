// src/component/cards/useDraggableCard.js
import { useRef, useState } from "react";

/**
 * useDraggableCard
 * DRAG en % del contenedor (no RESIZE).
 *
 * ✅ Regla AppLovin: SIN sessionStorage / localStorage
 * - No lee ni escribe storage
 * - No hace seed inicial desde storage
 */
export default function useDraggableCard({
  isDevMode,
  guide,
  myDiv,
  containerWidth,
  containerHeight,
  renderedWidth,
  renderedHeight,
  scaleMin,
  dragAxis = "both",
  dragDirThresholdPct = 1.5,
  colorGuide = "red",
  setGuideMidExtern, // opcional
  onPressDragStart,
  onPressDrag,
  onPressDragEnd,
  computeGuideMidlines, // (el) => {topY,bottomY,leftX,rightX}
  // ⚠️ storageKey / isPortrait quedan fuera por regla (NO se usan)
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDeltaPct, setDragDeltaPct] = useState({ x: 0, y: 0 });
  const [dragBasePct, setDragBasePct] = useState({ x: 0, y: 0 });

  const startXYRef = useRef({ x: 0, y: 0 });
  const startCardXYPercentRef = useRef({ x: 0, y: 0 });
  const loggedEndRef = useRef(false);

  // ✅ FIX: ref espejo para evitar "stale state" cuando mueves muy rápido
  const dragDeltaPctRef = useRef({ x: 0, y: 0 });

  // Estado expuesto: SOLO posición "live" (x,y) en %
  const [liveXY, setLiveXY] = useState(null);

  // ✅ Reset para eliminar el offset acumulado del drag
  const resetDragBase = () => {
    setDragBasePct({ x: 0, y: 0 });
    setDragDeltaPct({ x: 0, y: 0 });
    dragDeltaPctRef.current = { x: 0, y: 0 };
  };

  // ✅ obtener elementos “tocados” por el DIV (no por el mouse)
  const getTouchedElementsByDiv = () => {
    try {
      const el = myDiv?.current;
      if (!el) return [];
      if (typeof document === "undefined") return [];
      if (typeof document.elementsFromPoint !== "function") return [];

      const rect = el.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return [];

      const inset = 1; // px adentro para evitar bordes exactos
      const points = [
        { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, // centro
        { x: rect.left + inset, y: rect.top + inset }, // esquina sup izq
        { x: rect.right - inset, y: rect.top + inset }, // sup der
        { x: rect.left + inset, y: rect.bottom - inset }, // inf izq
        { x: rect.right - inset, y: rect.bottom - inset }, // inf der
      ];

      const uniq = new Set();
      const out = [];

      for (const p of points) {
        const list = document.elementsFromPoint(p.x, p.y) || [];
        for (const node of list) {
          if (!node) continue;
          if (node === el) continue;
          if (el.contains(node)) continue;

          if (!uniq.has(node)) {
            uniq.add(node);
            out.push(node);
          }
        }
      }

      return out;
    } catch (_) {
      return [];
    }
  };

  const denomW = () => renderedWidth || containerWidth * (scaleMin || 1) || 1;
  const denomH = () => renderedHeight || containerHeight * (scaleMin || 1) || 1;

  const dirFromDelta = (dxPct, dyPct, thr) => {
    const horiz =
      Math.abs(dxPct) >= thr ? (dxPct > 0 ? "right" : "left") : null;
    const vert = Math.abs(dyPct) >= thr ? (dyPct > 0 ? "down" : "up") : null;

    const labels = [];
    if (horiz) labels.push(horiz);
    if (vert) labels.push(vert);

    const labelsEs = labels.map((d) =>
      d === "right"
        ? "derecha"
        : d === "left"
        ? "izquierda"
        : d === "up"
        ? "arriba"
        : "abajo",
    );

    return { horizontal: horiz, vertical: vert, labels, labelsEs };
  };

  const dirFromCenter = (xPct, yPct, thr) => {
    const dxC = xPct - 50;
    const dyC = yPct - 50;
    return dirFromDelta(dxC, dyC, thr);
  };

  const dominantFromCenter = (xPct, yPct, thr) => {
    const dxC = xPct - 50;
    const dyC = yPct - 50;
    const ax = Math.abs(dxC);
    const ay = Math.abs(dyC);
    if (ax < thr && ay < thr) return null;
    if (ax >= ay) return dxC > 0 ? "right" : "left";
    return dyC > 0 ? "down" : "up";
  };

  const handlePointerDownDrag = (e, currentBase, guideEnabled) => {
    setIsDragging(true);
    loggedEndRef.current = false;

    startXYRef.current = { x: e.clientX, y: e.clientY };

    startCardXYPercentRef.current = {
      x: currentBase.x + dragBasePct.x,
      y: currentBase.y + dragBasePct.y,
    };

    // ✅ FIX: reset delta también en ref
    dragDeltaPctRef.current = { x: 0, y: 0 };
    setDragDeltaPct({ x: 0, y: 0 });

    if (isDevMode && guideEnabled && typeof computeGuideMidlines === "function") {
      try {
        setGuideMidExtern?.(computeGuideMidlines(myDiv.current));
      } catch (_) {}
    }

    const startX = startCardXYPercentRef.current.x;
    const startY = startCardXYPercentRef.current.y;

    setLiveXY({ x: startX, y: startY });

    const elements = getTouchedElementsByDiv();

    onPressDragStart?.({
      status: "start",
      xPercent: startX,
      yPercent: startY,
      directionFromStart: {
        horizontal: null,
        vertical: null,
        labels: [],
        labelsEs: [],
      },
      directionFromCenter: dirFromCenter(startX, startY, dragDirThresholdPct),
      dominantFromCenter: dominantFromCenter(startX, startY, dragDirThresholdPct),
      container: { width: containerWidth || 0, height: containerHeight || 0 },
      nativeEvent: e,
      resetDragBase,
      elements,
    });
  };

  const handlePointerMoveDrag = (e, currentBase, guideEnabled) => {
    if (!isDragging) return;

    const dxPx = e.clientX - startXYRef.current.x;
    const dyPx = e.clientY - startXYRef.current.y;

    let dxPct = (dxPx / denomW()) * 100;
    let dyPct = (dyPx / denomH()) * 100;

    if (dragAxis === "x") dyPct = 0;
    if (dragAxis === "y") dxPct = 0;

    // ✅ FIX: guarda también en ref (valor más reciente, sin esperar setState)
    dragDeltaPctRef.current = { x: dxPct, y: dyPct };
    setDragDeltaPct({ x: dxPct, y: dyPct });

    const curX = startCardXYPercentRef.current.x + dxPct;
    const curY = startCardXYPercentRef.current.y + dyPct;

    if (isDevMode && guideEnabled && typeof computeGuideMidlines === "function") {
      try {
        setGuideMidExtern?.(computeGuideMidlines(myDiv.current));
      } catch (_) {}
    }

    setLiveXY({ x: curX, y: curY });

    const elements = getTouchedElementsByDiv();

    onPressDrag?.({
      status: "move",
      xPercent: curX,
      yPercent: curY,
      deltaPercent: { x: dxPct, y: dyPct },
      directionFromStart: dirFromDelta(dxPct, dyPct, dragDirThresholdPct),
      directionFromCenter: dirFromCenter(curX, curY, dragDirThresholdPct),
      dominantFromCenter: dominantFromCenter(curX, curY, dragDirThresholdPct),
      container: { width: containerWidth || 0, height: containerHeight || 0 },
      nativeEvent: e,
      resetDragBase,
      elements,
    });
  };

  const commitDragEnd = (e, currentBase, guideEnabled) => {
    if (loggedEndRef.current) return;

    const baseAtEnd = { ...currentBase };

    // ✅ FIX: usa el delta más reciente aunque React no haya actualizado state
    const deltaAtEnd = { ...dragDeltaPctRef.current };

    const baseDrag = { ...dragBasePct };

    const newBase = {
      x: baseDrag.x + deltaAtEnd.x,
      y: baseDrag.y + deltaAtEnd.y,
    };

    const endX = baseAtEnd.x + newBase.x;
    const endY = baseAtEnd.y + newBase.y;

    setDragBasePct(newBase);

    // reset delta state + ref
    setDragDeltaPct({ x: 0, y: 0 });
    dragDeltaPctRef.current = { x: 0, y: 0 };

    setIsDragging(false);

    if (!(isDevMode && guideEnabled)) {
      setGuideMidExtern?.(null);
    }

    loggedEndRef.current = true;

    setLiveXY({ x: endX, y: endY });

    const elements = getTouchedElementsByDiv();

    onPressDragEnd?.({
      status: "leave",
      xPercent: endX,
      yPercent: endY,
      deltaPercent: { ...deltaAtEnd },
      directionFromStart: dirFromDelta(
        endX - startCardXYPercentRef.current.x,
        endY - startCardXYPercentRef.current.y,
        dragDirThresholdPct,
      ),
      directionFromCenter: dirFromCenter(endX, endY, dragDirThresholdPct),
      dominantFromCenter: dominantFromCenter(endX, endY, dragDirThresholdPct),
      container: { width: containerWidth || 0, height: containerHeight || 0 },
      nativeEvent: e,
      resetDragBase,
      elements,
    });
  };

  return {
    isDragging,
    dragDeltaPct,
    dragBasePct,
    setDragBasePct,
    setDragDeltaPct,
    resetDragBase,
    startXYRef,
    startCardXYPercentRef,
    handlePointerDownDrag,
    handlePointerMoveDrag,
    commitDragEnd,
    liveXY,
  };
}