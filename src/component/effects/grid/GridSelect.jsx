// App.jsx
import {
    useState,
    useEffect,
    useRef,
    useCallback,
  } from "react";
  import { motion } from "framer-motion";
  import "./styles.css";
  
  // ============================
  // GalleryItem
  // ============================
  function GalleryItem({
    index,
    selectedIndex,
    setSelectedIndex,
    sizeClass,
    gridSpan,
    children,
    registerNode, // callback para registrar el <li> en App
    isBaseHidden, // 👈 si true, ocultamos la miniatura del grid
  }) {
    const isSelected = index === selectedIndex;
    const localRef = useRef(null);
  
    const itemStyle = {
      zIndex: isSelected ? 10 : 1,
    };
  
    // Span del grid (grid prop)
    if (gridSpan && Array.isArray(gridSpan)) {
      const [spanX, spanY] = gridSpan;
      if (spanX > 0) itemStyle.gridColumn = `span ${spanX}`;
      if (spanY > 0) itemStyle.gridRow = `span ${spanY}`;
    }
  
    const handleClick = (e) => {
      e.stopPropagation();
  
      if (!isSelected) {
        setSelectedIndex(index);
      } else {
        // toggle: si ya está seleccionada, la cerramos
        setSelectedIndex(null);
      }
    };
  
    return (
      <li
        ref={(node) => {
          localRef.current = node;
          if (typeof registerNode === "function") {
            registerNode(node);
          }
        }}
        className={`gallery-item ${sizeClass}`}
        data-selected={isSelected ? "true" : "false"}
        style={itemStyle}
        onClick={handleClick}
      >
        <div
          className="gallery-item-inner"
          style={{
            visibility: isBaseHidden ? "hidden" : "visible",
          }}
        >
          {children}
        </div>
      </li>
    );
  }
  
  // ============================
  // Helper: tamaño
  // ============================
  function getSizeClass(index) {
    const mod = index % 6;
    if (mod === 0) return "size-tall";
    if (mod === 1) return "size-wide";
    if (mod === 2) return "size-small";
    if (mod === 3) return "size-medium";
    if (mod === 4) return "size-tall";
    return "size-medium";
  }
  
  // ============================
  // Helper: offset relativo a root
  // ============================
  function getOffsetRelativeToRoot(el, rootEl) {
    let left = 0;
    let top = 0;
    let node = el;
  
    while (node && node !== rootEl && node instanceof HTMLElement) {
      left += node.offsetLeft;
      top += node.offsetTop;
      node = node.offsetParent;
    }
  
    return { left, top };
  }
  
  // ============================
  // Overlay por item
  // ============================
  function OverlayForItem({
    index,
    isOpen,
    rootRef,
    getItemElement,
    offsetX,
    offsetY,
    centerWidth,
    centerHeight,
    element,
    onStartOpen, // 👈 para ocultar base cuando se abre
    onFinishClose, // 👈 para mostrar base cuando termina de cerrar
    overlayDurationMs, // duración en ms
    flip, // 👈 efecto flip en eje X
  }) {
    const [geom, setGeom] = useState(null);
    // geom = { start: {left,top,width,height}, end: {...} }
  
    const buildGeometry = useCallback(() => {
      const rootEl = rootRef.current;
      if (!rootEl) return null;
  
      const triggerEl =
        typeof getItemElement === "function" ? getItemElement() : null;
      if (!triggerEl) return null;
  
      // 1) START -> relativo a .app-root
      const { left: startLeft, top: startTop } = getOffsetRelativeToRoot(
        triggerEl,
        rootEl
      );
      const startWidth = triggerEl.offsetWidth;
      const startHeight = triggerEl.offsetHeight;
  
      // 2) Elemento de referencia: PADRE DEL PADRE de .app-root
      let refEl = rootEl.parentElement;
      if (refEl && refEl.parentElement) {
        refEl = refEl.parentElement;
      } else {
        // fallback: si no hay padre del padre, usamos rootEl
        refEl = rootEl;
      }
  
      const refWidth = refEl.clientWidth;
      const refHeight = refEl.clientHeight;
  
      const px = typeof offsetX === "number" ? offsetX : 50;
      const py = typeof offsetY === "number" ? offsetY : 50;
  
      const clampedX = Math.max(0, Math.min(100, px));
      const clampedY = Math.max(0, Math.min(100, py));
  
      // 3) Centro objetivo en coordenadas del elemento de referencia (padre del padre)
      const targetCenterXRef = (refWidth * clampedX) / 100;
      const targetCenterYRef = (refHeight * clampedY) / 100;
  
      // 4) Posición de .app-root dentro de ese elemento de referencia
      const {
        left: rootLeftRef,
        top: rootTopRef,
      } = getOffsetRelativeToRoot(rootEl, refEl);
  
      // 5) Convertimos ese centro objetivo a coordenadas de .app-root
      const targetCenterX = targetCenterXRef - rootLeftRef;
      const targetCenterY = targetCenterYRef - rootTopRef;
  
      const targetWidth =
        typeof centerWidth === "number" && centerWidth > 0
          ? centerWidth
          : startWidth;
  
      const targetHeight =
        typeof centerHeight === "number" && centerHeight > 0
          ? centerHeight
          : startHeight;
  
      const targetLeft = targetCenterX - targetWidth / 2;
      const targetTop = targetCenterY - targetHeight / 2;
  
      return {
        start: {
          left: startLeft,
          top: startTop,
          width: startWidth,
          height: startHeight,
        },
        end: {
          left: targetLeft,
          top: targetTop,
          width: targetWidth,
          height: targetHeight,
        },
      };
    }, [rootRef, getItemElement, offsetX, offsetY, centerWidth, centerHeight]);
  
    // Cuando se abre, calculamos geometría
    useEffect(() => {
      if (isOpen) {
        const g = buildGeometry();
        if (g) {
          setGeom(g);
        }
      }
    }, [isOpen, buildGeometry]);
  
    // Cuando ya tenemos geom y está abierto, avisamos que oculte la base
    useEffect(() => {
      if (isOpen && geom && typeof onStartOpen === "function") {
        onStartOpen(index);
      }
    }, [isOpen, geom, onStartOpen, index]);
  
    // Si nunca se ha abierto y está cerrado → no renderizamos nada
    if (!geom) {
      return null;
    }
  
    const animateBase = isOpen ? geom.end : geom.start;
  
    // 🔥 flip:
    // - ENTRADA (isOpen === true): EXACTAMENTE como lo tenías -> [1, 0.1, 1]
    // - SALIDA  (isOpen === false): mismo efecto pero en "sentido contrario" usando valores negativos
    let animateTarget;
    if (!flip) {
      // sin flip, solo movimiento
      animateTarget = { ...animateBase, scaleX: 1 };
    } else if (isOpen) {
      // 👉 ENTRADA: se queda TAL CUAL estaba en tu código original
      animateTarget = {
        ...animateBase,
        scaleX: [1, -0, 1],
      };
    } else {
      // 👉 SALIDA: flip "contrario" usando escala negativa
      // Puedes ajustar la fuerza cambiando -0.1 por -0.2 o -0.3 si quieres más exagerado
      animateTarget = {
        ...animateBase,
        scaleX: [1, 0.3, 1],
      };
    }
  
    return (
      <motion.div
        className="gallery-overlay-item"
        initial={{ ...geom.start, scaleX: 1 }}
        animate={animateTarget}
        transition={{
          duration:
            typeof overlayDurationMs === "number"
              ? overlayDurationMs / 1000
              : 0.8,
          ease: "easeInOut",
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onAnimationComplete={() => {
          // Si terminó la animación de cierre (isOpen === false),
          // avisamos al padre para que muestre la base
          if (!isOpen && typeof onFinishClose === "function") {
            onFinishClose(index);
            setGeom(null);
          }
        }}
        style={{
          transformOrigin: "center center",
        }}
      >
        <div className="gallery-item-inner">{element}</div>
      </motion.div>
    );
  }
  
  // ============================
  // App principal
  // ============================
  export default function GridSelect({
    centerWidth = 300,
    centerHeight = 200,
    finalXPercent = 0.5, // sin uso, conservar por compat
    finalYPercent = 0.5, // sin uso
    offsetX = 50,
    offsetY = 50,
    elements = [],
    row,
    col,
    grid,
    automatic = false, // modo automático
    automaticIntervalMs = 2500, // intervalo entre auto-clicks
    overlayDurationMs = 800, // duración en ms del movimiento
    gap = 16, // espacio entre celdas (en px)
    flip = false, // activar/desactivar flip en eje X
  }) {
    const [selectedIndex, setSelectedIndex] = useState(null);
  
    const rootRef = useRef(null);
    const itemNodesRef = useRef([]); // array de nodos DOM
  
    const [hiddenBaseIndices, setHiddenBaseIndices] = useState([]);
  
    const totalItems = elements.length;
  
    const colsNum = typeof col === "number" && col > 0 ? Math.floor(col) : 4;
    const rowsNum =
      typeof row === "number" && row > 0
        ? Math.floor(row)
        : Math.max(1, Math.ceil((totalItems || 1) / (colsNum || 1)));
  
    const gridStyle = {
      gridTemplateColumns: `repeat(${colsNum}, 1fr)`,
      gridTemplateRows: `repeat(${rowsNum}, minmax(0, 1fr))`,
      gridAutoFlow: "dense",
      gap: typeof gap === "number" ? `${gap}px` : gap,
    };
  
    const pattern = Array.isArray(grid) && grid.length > 0 ? grid : [[1, 1]];
  
    const hideBaseIndex = useCallback((idx) => {
      setHiddenBaseIndices((prev) => {
        if (prev.includes(idx)) return prev;
        return [...prev, idx];
      });
    }, []);
  
    const showBaseIndex = useCallback((idx) => {
      setHiddenBaseIndices((prev) => prev.filter((i) => i !== idx));
    }, []);
  
    // ============================
    // 🔁 MODO AUTOMÁTICO
    // ============================
    useEffect(() => {
      if (!automatic || elements.length === 0) return;
  
      let cancelled = false;
      let timerId;
  
      const tick = () => {
        if (cancelled) return;
  
        setSelectedIndex((prev) => {
          if (prev === null || prev === undefined) {
            return 0; // primera vez
          }
          const next = (prev + 1) % elements.length;
          return next;
        });
  
        timerId = window.setTimeout(tick, automaticIntervalMs);
      };
  
      // primer “click automático” después del intervalo
      timerId = window.setTimeout(tick, automaticIntervalMs);
  
      return () => {
        cancelled = true;
        if (timerId) {
          clearTimeout(timerId);
        }
      };
    }, [automatic, elements.length, automaticIntervalMs]);
  
    // Click global: clic fuera → cerrar cualquier overlay
    useEffect(() => {
      function handleBodyClick(e) {
        const isOnCard = e.target.closest(
          ".gallery-item, .gallery-overlay-item"
        );
        if (isOnCard) return;
  
        if (selectedIndex !== null) {
          setSelectedIndex(null);
        }
      }
  
      document.body.addEventListener("click", handleBodyClick);
      return () => {
        document.body.removeEventListener("click", handleBodyClick);
      };
    }, [selectedIndex]);
  
    // ESC → cerrar
    useEffect(() => {
      function handleKeyDown(e) {
        if (e.key === "Escape") {
          if (selectedIndex !== null) {
            setSelectedIndex(null);
          }
        }
      }
  
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [selectedIndex]);
  
    return (
      <div className="app-root" ref={rootRef}>
        <ul className="gallery-container" style={gridStyle}>
          {elements.map((element, i) => {
            const gridSpan = pattern[i % pattern.length];
            const isBaseHidden = hiddenBaseIndices.includes(i);
  
            return (
              <GalleryItem
                key={i}
                index={i}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                sizeClass={getSizeClass(i)}
                gridSpan={gridSpan}
                registerNode={(node) => {
                  itemNodesRef.current[i] = node;
                }}
                isBaseHidden={isBaseHidden}
              >
                {element}
              </GalleryItem>
            );
          })}
        </ul>
  
        {elements.map((element, i) => (
          <OverlayForItem
            key={i}
            index={i}
            isOpen={selectedIndex === i}
            rootRef={rootRef}
            getItemElement={() => itemNodesRef.current[i]}
            offsetX={offsetX}
            offsetY={offsetY}
            centerWidth={centerWidth}
            centerHeight={centerHeight}
            element={element}
            onStartOpen={hideBaseIndex}
            onFinishClose={showBaseIndex}
            overlayDurationMs={overlayDurationMs}
            flip={flip}
          />
        ))}
      </div>
    );
  }
  