import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * AutoScrollBox
 * - fitParent: si true, ocupa 100% del alto del padre (ignora `height`)
 * - height: "60vh" | "100dvh" | number (px) (se usa cuando fitParent=false)
 * - fullscreen, mountToBody, useVisualViewport: para pantalla completa real
 * - background: color/gradiente/imagen de fondo del scroller
 * - fadePx/useMaskFade: degradado superior/inferior estable por CSS mask
 * - controlsMode: "auto" | "always" | "hidden"
 * - controlsScale: factor para agrandar/encoger controles (1 = normal)
 * - reset: boolean | number | string  -> al cambiar, reinicia (scrollTop=0, sin transform)
 * - onReset: () => void               -> callback al terminar el reinicio
 * - El contenido **siempre** hereda font-size del padre.
 */
export default function AutoScrollBox({
  fitParent = false,
  height = "60vh",
  speed = 40,
  pauseOnHover = true,
  loop = true,
  controlsMode = "auto",
  controlsScale = 1.5,
  autoHideMs = 2000,
  fullscreen = false,
  mountToBody = false,
  useVisualViewport = true,
  fadePx = 24,
  useMaskFade = true,
  background = "transparent",
  children,
  style = {},
  className = "",
  reset,
  onReset,
}) {
  const boxRef = useRef(null);
  const contentRef = useRef(null);

  const [paused, setPaused] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(controlsMode === "always");
  const hideTimer = useRef(null);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(null);

  // Suavizado sin micro-pausas: commits por “bloques” + subpíxel con transform
  const yVirtualRef = useRef(0);
  const yCommittedRef = useRef(0);
  const QUANTUM_PX = 8; // ajusta 4–12 para más suavidad

  // Evitar pelear con el gesto (dedo abajo)
  const touchingRef = useRef(false);

  // Altura segura para fullscreen
  const [vhPx, setVhPx] = useState(
    typeof window !== "undefined" ? window.innerHeight : 0
  );
  useEffect(() => {
    if (!fullscreen) return;
    const update = () => {
      const h =
        useVisualViewport && window.visualViewport
          ? Math.round(window.visualViewport.height)
          : Math.round(window.innerHeight);
      setVhPx(h);
    };
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [fullscreen, useVisualViewport]);

  // Sincroniza en scroll manual (soluciona pantallazo al “subir”)
  useEffect(() => {
    const el = boxRef.current;
    const inner = contentRef.current;
    if (!el || !inner) return;

    const onScroll = () => {
      const y = el.scrollTop;
      yCommittedRef.current = y;
      yVirtualRef.current = y;
      inner.style.transform = "translateY(0px)";
      lastTimeRef.current = null;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Autoscroll con "quantum commits" + subpíxel continuo
  useEffect(() => {
    const el = boxRef.current;
    const inner = contentRef.current;
    if (!el || !inner) return;

    // Inicializa posiciones con el scroll actual
    yCommittedRef.current = el.scrollTop;
    yVirtualRef.current = el.scrollTop;

    const step = (t) => {
      if (lastTimeRef.current == null) lastTimeRef.current = t;
      const dt = (t - lastTimeRef.current) / 1000;
      lastTimeRef.current = t;

      const maxScroll = el.scrollHeight - el.clientHeight;

      // Nada que autoscrollear
      if (maxScroll <= 0) {
        inner.style.transform = "translateY(0px)";
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      if (!paused && speed > 0) {
        // Avance continuo
        yVirtualRef.current += speed * dt;

        let committed = yCommittedRef.current;
        let virtual = yVirtualRef.current;

        // No superar el final virtualmente
        if (virtual >= maxScroll) virtual = maxScroll;

        const delta = virtual - committed;

        // Commit solo cuando se acumula al menos QUANTUM_PX (o al final)
        if (delta >= QUANTUM_PX || virtual === maxScroll) {
          const blocks =
            virtual === maxScroll
              ? Math.ceil(delta) // cierra sin residuos
              : Math.floor(delta / QUANTUM_PX) * QUANTUM_PX;

          committed = Math.min(committed + blocks, maxScroll);
          if (!touchingRef.current) {
            el.scrollTop = committed;
          }
          yCommittedRef.current = committed;
        }

        // Subpíxel pendiente pintado en el contenido (suavidad total)
        let frac = virtual - yCommittedRef.current; // puede ser negativo si el usuario “sube”
        if (frac < 0) {
          // Si se fue hacia arriba, alinea y evita translate positivo
          yCommittedRef.current = virtual;
          frac = 0;
        }
        inner.style.transform = frac
          ? `translateY(-${frac.toFixed(4)}px)`
          : "translateY(0px)";

        // Al llegar al final
        if (virtual >= maxScroll) {
          if (loop) {
            if (!touchingRef.current) {
              el.scrollTop = 0;
            }
            yCommittedRef.current = 0;
            yVirtualRef.current = 0;
            inner.style.transform = "translateY(0px)";
          } else {
            setPaused(true);
          }
        }
      } else {
        // Pausa: dejar todo consistente para reanudar sin salto
        inner.style.transform = "translateY(0px)";
        yVirtualRef.current =
          yCommittedRef.current = boxRef.current?.scrollTop || 0;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paused, speed, loop]);

  // RESET por props (cambia `reset` para dispararlo)
  useEffect(() => {
    const el = boxRef.current;
    const inner = contentRef.current;
    if (!el || !inner) return;

    el.scrollTop = 0;
    yCommittedRef.current = 0;
    yVirtualRef.current = 0;
    inner.style.transform = "translateY(0px)";
    lastTimeRef.current = null; // evita salto en el primer frame tras reset
    setPaused(false);

    onReset && onReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  // Controles (visibilidad)
  useEffect(() => {
    if (controlsMode === "always") setControlsVisible(true);
    if (controlsMode === "hidden") setControlsVisible(false);
    if (controlsMode === "auto") setControlsVisible(true);
  }, [controlsMode]);

  const bumpControls = () => {
    if (controlsMode !== "auto") return;
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), autoHideMs);
  };

  // Atajos básicos
  useEffect(() => {
    const onKey = (e) => {
      const key = e.key?.toLowerCase?.();
      if (key === "c") {
        if (controlsMode !== "hidden") setControlsVisible((v) => !v);
      }
      if (key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [controlsMode]);

  const onEnter = () => {
    touchingRef.current = true;
    if (pauseOnHover) setPaused(true);
  };
  const onLeave = () => {
    touchingRef.current = false;
    if (pauseOnHover) setPaused(false);
  };

  // Fade por máscara (no vibra)
  const maskStyles = useMaskFade
    ? {
        WebkitMaskImage: `linear-gradient(to bottom,
          rgba(0,0,0,0) 0,
          rgba(0,0,0,1) ${fadePx}px,
          rgba(0,0,0,1) calc(100% - ${fadePx}px),
          rgba(0,0,0,0) 100%)`,
        maskImage: `linear-gradient(to bottom,
          rgba(0,0,0,0) 0,
          rgba(0,0,0,1) ${fadePx}px,
          rgba(0,0,0,1) calc(100% - ${fadePx}px),
          rgba(0,0,0,0) 100%)`,
        transform: "translateZ(0)",
      }
    : {};

  // Wrapper (puede ir en portal si fullscreen o mountToBody)
  const Wrapper = (
    <div
      className={`relative ${className}`}
      style={{
        ...(fullscreen
          ? {
              position: "fixed",
              inset: 0,
              width: "100vw",
              height: vhPx ? `${vhPx}px` : "100dvh",
              zIndex: 9999,
            }
          : {}),
        ...(fitParent && !fullscreen
          ? {
              position: "relative",
              width: "100%",
              height: "100%",
            }
          : {}),
        ...style,
      }}
      onMouseMove={bumpControls}
      onTouchStart={bumpControls}
    >
      <div
        ref={boxRef}
        role="region"
        aria-label="Auto scroll de texto"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onTouchStart={onEnter}
        onTouchEnd={onLeave}
        style={{
          height: fullscreen
            ? "100%"
            : fitParent
            ? "100%"
            : typeof height === "number"
            ? `${height}px`
            : height,
          width: "100%",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch", // iOS suaviza y evita glitches
          lineHeight: 1.5,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          position: "relative",
          background,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          scrollBehavior: "auto", // evita que un smooth global absorba pasos
          ...maskStyles,
        }}
        className="autoscrll"
      >
        <style>{`.autoscrll::-webkit-scrollbar{ display:none }`}</style>

        <div
          ref={contentRef}
          style={{
            padding: "0 16px",
            fontSize: "inherit", // ← SIEMPRE hereda del padre
            willChange: "transform",
          }}
        >
          {children}
        </div>
      </div>

      {controlsMode !== "hidden" && controlsVisible && (
        <div
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            display: "flex",
            gap: 8 * controlsScale,
            background: "rgba(0,0,0,0.4)",
            borderRadius: 10 * controlsScale,
            padding: `${6 * controlsScale}px ${8 * controlsScale}px`,
            backdropFilter: "blur(8px)",
            transform: `scale(${controlsScale})`,
            transformOrigin: "right bottom",
          }}
        >
          <button
            onClick={() => setPaused((p) => !p)}
            style={getBtnStyle(controlsScale)}
            title={paused ? "Reanudar (Espacio)" : "Pausar (Espacio)"}
          >
            {paused ? "▶" : "⏸"}
          </button>
          <button
            onClick={() => {
              const el = boxRef.current;
              if (!el) return;
              el.scrollTop = 0;
              yCommittedRef.current = 0;
              yVirtualRef.current = 0;
              if (contentRef.current) contentRef.current.style.transform = "translateY(0px)";
              lastTimeRef.current = null;
            }}
            style={getBtnStyle(controlsScale)}
            title="Volver arriba"
          >
            ⤒
          </button>
          <button
            onClick={() => {
              const el = boxRef.current;
              if (!el) return;
              const max = el.scrollHeight - el.clientHeight;
              el.scrollTop = Math.min(el.scrollTop + 200, max);
              // sincroniza para evitar saltos tras scroll manual
              yCommittedRef.current = el.scrollTop;
              yVirtualRef.current = el.scrollTop;
              if (contentRef.current) contentRef.current.style.transform = "translateY(0px)";
              lastTimeRef.current = null;
            }}
            style={getBtnStyle(controlsScale)}
            title="Bajar 200px"
          >
            ↓
          </button>
        </div>
      )}
    </div>
  );

  if ((fullscreen || mountToBody) && typeof document !== "undefined") {
    return createPortal(Wrapper, document.body);
  }
  return Wrapper;
}

const getBtnStyle = (scale = 1) => ({
  fontSize: 14 * scale,
  lineHeight: 1,
  padding: `${6 * scale}px ${10 * scale}px`,
  minWidth: 32 * scale,
  minHeight: 32 * scale,
  borderRadius: 8 * scale,
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  userSelect: "none",
});
