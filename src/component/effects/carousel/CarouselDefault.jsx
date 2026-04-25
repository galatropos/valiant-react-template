// src/component/effects/carousel/CarouselDefault.jsx
import React, { useRef, useEffect, useState, useMemo } from "react";
import Card from "../../Card";

const DEFAULT_PORTRAIT_BASE = { width: 10, height: 10, anchor: "middle" };
const DEFAULT_LANDSCAPE_BASE = { width: 10, height: 10, anchor: "middle" };

// Helpers
const quantize = (n) => {
  const px =
    1 /
    ((typeof window !== "undefined" && window.devicePixelRatio) || 1);
  return Math.round(n / px) * px;
};

const getInnerHeightPx = (el) => {
  if (!el) return 0;
  const cs = getComputedStyle(el);
  const pt = parseFloat(cs.paddingTop) || 0;
  const pb = parseFloat(cs.paddingBottom) || 0;
  return Math.max(0, Math.floor(el.clientHeight - pt - pb));
};

const getInnerWidthPx = (el) => {
  if (!el) return 0;
  const cs = getComputedStyle(el);
  const pl = parseFloat(cs.paddingLeft) || 0;
  const pr = parseFloat(cs.paddingRight) || 0;
  return Math.max(0, Math.floor(el.clientWidth - pl - pr));
};

// Dirección → eje + signo
function resolveAxisAndDir(dirStr) {
  const d = (dirStr || "").toLowerCase();
  if (d === "left") return { axis: "h", sign: -1 };
  if (d === "right") return { axis: "h", sign: +1 };
  if (d === "top") return { axis: "v", sign: -1 };
  if (d === "bottom") return { axis: "v", sign: +1 };
  return { axis: "h", sign: d === "left" ? -1 : +1 };
}

/** Fuerza el ajuste de cualquier <img> descendiente del slot (versión original) */
function forceFitDescendantImg(slotEl, axis, safeW, safeH) {
  if (!slotEl) return;
  const img = slotEl.querySelector("img");
  if (!img) return;

  // Asegurar carga “rápida”
  try {
    img.loading = "eager";
  } catch {}
  try {
    img.decoding = "async";
  } catch {}

  // Ajuste de tamaño por eje (como lo tenías)
  if (axis === "h") {
    // Alto fijo, ancho auto (contain)
    img.style.height = `${safeH}px`;
    img.style.maxHeight = `${safeH}px`;
    img.style.width = "auto";
    img.style.maxWidth = "none";
  } else {
    // Ancho fijo, alto auto (contain)
    img.style.width = `${safeW}px`;
    img.style.maxWidth = `${safeW}px`;
    img.style.height = "auto";
    img.style.maxHeight = "none";
  }

  // Otras seguridades
  img.style.objectFit = "contain";
  img.style.display = "block";
  img.style.boxSizing = "border-box";
}

/**
 * Carrusel infinito que acepta <img> directos y componentes que renderizan <img>
 * (por ejemplo, <RandomImg />)
 *
 * Versión sin romper tamaños:
 * - Triplicado: [1][2][3] para evitar huecos.
 * - Lógica de tamaño igual a la original.
 */
export default function CarouselDefault(props) {
  const {
    elements = [],
    gapPx = 16,
    stepDuration = 1200, // ms
    portrait = DEFAULT_PORTRAIT_BASE,
    landscape = DEFAULT_LANDSCAPE_BASE,
    initialDirection = "right",
    direction, // "left" | "right" | "top" | "bottom"
  } = props;

  // compat por si vino con typo "sptepDuration"
  const effectiveStepDuration = props.sptepDuration ?? stepDuration;

  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const rafRef = useRef(0);
  const startRef = useRef(null);
  const isPausedRef = useRef(false);

  // Refs para desacoplar layout de animación
  const limitRef = useRef(0); // longitud de UNA copia (L)
  const speedRef = useRef(60); // px/seg

  // Medidas visibles
  const [cardInnerH, setCardInnerH] = useState(0); // alto para horizontal
  const [cardInnerW, setCardInnerW] = useState(0); // ancho para vertical
  const [singleLenPx, setSingleLenPx] = useState(0); // longitud de UNA copia del track
  const [ratios, setRatios] = useState([]); // aspect ratio por item (w/h)

  // Eje y signo según dirección
  const { axis, sign } = resolveAxisAndDir(direction || initialDirection);

  // Lista TRIPLICADA para marquee infinito: [1][2][3]
  const tripled = useMemo(() => {
    if (!elements.length) return [];
    return [...elements, ...elements, ...elements];
  }, [elements]);

  // Medir contenedor
  const measureCard = () => {
    const el = containerRef.current;
    if (!el) return;
    setCardInnerH(getInnerHeightPx(el));
    setCardInnerW(getInnerWidthPx(el));
  };

  // Medir longitud de UNA copia dentro del track triplicado.
  // Si hay N elementos base, la triplicada tiene 3N.
  // La segunda copia arranca en el índice N, la tercera en 2N.
  const measureSingleLen = () => {
    const track = trackRef.current;
    if (!track) {
      setSingleLenPx(0);
      return;
    }

    const children = track.children;
    const len = children.length;
    if (!len) {
      setSingleLenPx(0);
      return;
    }

    const baseCount = len / 3;
    if (!Number.isInteger(baseCount) || baseCount <= 0) {
      setSingleLenPx(0);
      return;
    }

    const secondStart = children[baseCount]; // inicio de la segunda copia
    if (!secondStart) {
      setSingleLenPx(0);
      return;
    }

    let singleLen = 0;
    if (axis === "h") {
      // Distancia horizontal desde el inicio del track al inicio de la segunda copia
      singleLen = secondStart.offsetLeft;
    } else {
      // Distancia vertical desde el inicio del track al inicio de la segunda copia
      singleLen = secondStart.offsetTop;
    }

    setSingleLenPx(singleLen || 0);
  };

  // Montaje + resize (debounced)
  useEffect(() => {
    const reflow = () => {
      measureCard();
      setTimeout(measureSingleLen, 0);
    };

    reflow();
    let ro, t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(reflow, 120);
    };
    try {
      ro = new ResizeObserver(onResize);
      if (containerRef.current) ro.observe(containerRef.current);
    } catch {
      window.addEventListener("resize", onResize);
    }
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener?.("resize", onResize);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axis]);

  /** Medir ratios desde el DOM (sirve para componentes que internamente tienen <img>) */
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !elements.length) {
      setRatios([]);
      return;
    }

    // Solo la PRIMERA copia (sin duplicados)
    const imgs = Array.from(track.querySelectorAll("img")).slice(
      0,
      elements.length
    );
    if (imgs.length === 0) {
      setRatios(new Array(elements.length).fill(1));
      return;
    }

    const next = new Array(elements.length).fill(1);
    let pending = imgs.length;

    imgs.forEach((img, i) => {
      const done = () => {
        const w = img.naturalWidth || 0;
        const h = img.naturalHeight || 0;
        next[i] = w > 0 && h > 0 ? w / h : 1;
        if (--pending === 0) setRatios(next);
      };
      if (img.complete) {
        done();
      } else {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }
    });
  }, [elements, axis]);

  // Re-medición de singleLen cuando cambien ratios o medidas
  useEffect(() => {
    const id = setTimeout(measureSingleLen, 0);
    return () => clearTimeout(id);
  }, [ratios, cardInnerH, cardInnerW, gapPx, elements, axis]);

  // Actualizar refs de velocidad SIN reiniciar animación
  useEffect(() => {
    const durSec = Math.max(0.2, effectiveStepDuration / 1000);
    const baseSize =
      axis === "h" ? cardInnerH || 200 : cardInnerW || 200;
    const pxPerSec = Math.max(60, baseSize / durSec);
    speedRef.current = pxPerSec;
  }, [effectiveStepDuration, cardInnerH, cardInnerW, axis]);

  // Actualizar ref de longitud de UNA copia
  useEffect(() => {
    limitRef.current = singleLenPx;
  }, [singleLenPx]);

  // Animación (horizontal/vertical) con 3 copias.
  // - right: como ya te gustó, sin huecos.
  // - left: rango controlado para que tampoco deje vacío.
  useEffect(() => {
    const viewportSize = axis === "h" ? cardInnerW : cardInnerH;
    const L = singleLenPx;

    // Si todavía no tenemos medidas válidas, no montamos el loop
    if (!L || !viewportSize) {
      return;
    }

    let last = 0;
    const track = trackRef.current;
    if (!track) return;

    // Posición inicial: arrancamos en -L (copia del medio)
    let pos = -L;

    const loop = (ts) => {
      if (isPausedRef.current) return;
      if (!last) last = ts;
      const dt = (ts - last) / 1000;
      last = ts;

      const limit = limitRef.current;
      const pxPerSec = speedRef.current;

      if (limit > 0 && pxPerSec > 0) {
        pos += pxPerSec * sign * dt;

        if (sign < 0) {
          // IZQUIERDA / ARRIBA: nos movemos en (-L, 0]
          const minPos = -limit;
          if (pos <= minPos) {
            pos += limit; // vuelve a rango (-L, 0]
          }
        } else {
          // DERECHA / ABAJO: mantenemos wrap como ya te gustó
          if (pos >= 0) {
            pos -= limit; // mantiene el movimiento continuo
          }
        }
      }

      const qPos = quantize(pos);
      if (axis === "h") {
        track.style.transform = `translate3d(${qPos}px,0,0)`;
      } else {
        track.style.transform = `translate3d(0,${qPos}px,0)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    startRef.current = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      last = 0;
      isPausedRef.current = false;
      rafRef.current = requestAnimationFrame(loop);
    };

    startRef.current();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [axis, sign, singleLenPx, cardInnerW, cardInnerH]);

  // Hover
  const handleEnter = () => {
    isPausedRef.current = true;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  };

  const handleLeave = () => {
    if (isPausedRef.current) {
      isPausedRef.current = false;
      startRef.current?.();
    }
  };

  // Render
  const safeH = cardInnerH || 200;
  const safeW = cardInnerW || 200;

  return (
    <Card
      style={{
        overflow: "hidden",
        padding: 8,
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
      portrait={portrait}
      landscape={landscape}
      ref={containerRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div
        ref={trackRef}
        style={{
          display: "flex",
          flexDirection: axis === "h" ? "row" : "column",
          alignItems: "stretch",
          gap: gapPx,
          transform: "translate3d(0,0,0)",
          willChange: "transform",
          backfaceVisibility: "hidden",
          height: axis === "h" ? `${safeH}px` : "auto",
          width: axis === "v" ? `${safeW}px` : "auto",
          whiteSpace: axis === "h" ? "nowrap" : "normal",
        }}
      >
        {tripled.map((el, i) => {
          const baseIdx = elements.length ? i % elements.length : 0;
          const ratio = ratios[baseIdx] || 1;
          const isImg = React.isValidElement(el) && el.type === "img";

          // Tamaños por eje (igual que tu original):
          const itemW =
            axis === "h"
              ? Math.max(1, Math.round(safeH * ratio))
              : safeW;
          const itemH =
            axis === "h"
              ? safeH
              : Math.max(1, Math.round(safeW / ratio));

          const slotRef = (node) => {
            if (node) {
              requestAnimationFrame(() =>
                forceFitDescendantImg(node, axis, safeW, safeH)
              );
            }
          };

          return (
            <div
              key={`slot-${i}`}
              data-slot-idx={baseIdx}
              ref={slotRef}
              style={{
                width: `${itemW}px`,
                height: `${itemH}px`,
                borderRadius: 10,
                padding: isImg ? 0 : 12,
                boxSizing: "border-box",
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                willChange: "transform",
                contain: "layout paint",
              }}
            >
              {/* Contenedor 100% para cualquier contenido */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                }}
              >
                {isImg
                  ? React.cloneElement(el, {
                      style: {
                        ...(el.props.style || {}),
                        ...(axis === "h"
                          ? {
                              height: `${safeH}px`,
                              width: "auto",
                              maxHeight: `${safeH}px`,
                            }
                          : {
                              width: `${safeW}px`,
                              height: "auto",
                              maxWidth: `${safeW}px`,
                            }),
                        display: "block",
                        boxSizing: "border-box",
                        objectFit: "contain",
                      },
                      loading: "eager",
                      decoding: "async",
                    })
                  : el}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
