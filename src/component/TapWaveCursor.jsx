// TapWaveCursor.jsx
import React from "react";

export default function TapWaveCursor({
  // Apariencia base
  size = 56,                 // diámetro base de referencia (px)
  color = "#ffffff",         // color de la onda (borde o relleno)
  borderWidth = 2,           // grosor del borde si useOutline=true
  shadow = "none",           // "none" para máximo rendimiento
  useOutline = true,         // true: círculo con borde | false: círculo relleno

  // Comportamiento/animación
  waves = 3,                 // número de ondas por toque
  waveInterval = 110,        // ms entre ondas
  duration = 600,            // ms de cada onda
  maxScale = 3.2,            // escala final relativa (1 = tamaño base)
  easing = "cubic-bezier(.22,.61,.36,1)", // easing de expansión
  startOpacity = 0.35,       // opacidad inicial de cada onda
  endOpacity = 0,            // opacidad final de cada onda
  zIndex = 99999,            // overlay
  allowSecondary = false,    // permitir clic derecho/medio
}) {
  const containerRef = React.useRef(null);
  const timeoutsRef = React.useRef(new Set()); // para limpiar timers
  const prefersReduced = React.useRef(false);

  React.useEffect(() => {
    prefersReduced.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    // Capa fija
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.inset = "0";
    container.style.pointerEvents = "none";
    container.style.zIndex = String(zIndex);
    container.style.contain = "layout style paint";
    containerRef.current = container;
    document.body.appendChild(container);

    const r = size / 2;

    const createWave = (x, y) => {
      const ring = document.createElement("div");
      ring.style.position = "fixed";
      ring.style.left = "0";
      ring.style.top = "0";
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.borderRadius = "50%";
      ring.style.boxShadow = shadow;
      ring.style.willChange = "transform, opacity";
      ring.style.transform = `translate3d(${x - r}px, ${y - r}px, 0) scale(1)`;
      ring.style.opacity = String(startOpacity);
      ring.style.contain = "layout style paint";

      if (useOutline) {
        ring.style.border = `${borderWidth}px solid ${color}`;
        ring.style.background = "transparent";
      } else {
        ring.style.border = "none";
        ring.style.background = color;
      }

      container.appendChild(ring);

      // Animación con Web Animations API (sin forzar reflow)
      const anim = ring.animate(
        [
          { transform: `translate3d(${x - r}px, ${y - r}px, 0) scale(1)`, opacity: startOpacity },
          { transform: `translate3d(${x - r}px, ${y - r}px, 0) scale(${maxScale})`, opacity: endOpacity },
        ],
        {
          duration: prefersReduced.current ? 0 : duration,
          easing: easing,
          fill: "forwards",
        }
      );

      const cleanup = () => {
        ring.remove();
      };
      anim.addEventListener?.("finish", cleanup);
      // Fallback por si acaso
      const fallback = setTimeout(cleanup, (prefersReduced.current ? 0 : duration) + 80);
      timeoutsRef.current.add(fallback);
    };

    const spawnBurst = (x, y) => {
      if (prefersReduced.current) {
        // Genera sólo una onda instantánea (sin animación)
        createWave(x, y);
        return;
      }
      // secuencia de ondas
      for (let i = 0; i < Math.max(1, waves); i++) {
        const t = setTimeout(() => createWave(x, y), i * waveInterval);
        timeoutsRef.current.add(t);
      }
    };

    const onPointerDown = (e) => {
      if (!allowSecondary) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
      }
      // Coordenadas de la pantalla (fixed)
      spawnBurst(e.clientX, e.clientY);
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        // Cancela timers pendientes si se oculta la pestaña
        for (const t of timeoutsRef.current) clearTimeout(t);
        timeoutsRef.current.clear();
        // Limpia ondas vivas (si aún hay)
        container.querySelectorAll("div").forEach((n) => n.remove());
      }
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const t of timeoutsRef.current) clearTimeout(t);
      timeoutsRef.current.clear();
      container.querySelectorAll("div").forEach((n) => n.remove());
      container.remove();
    };
  }, [
    size,
    color,
    borderWidth,
    shadow,
    useOutline,
    waves,
    waveInterval,
    duration,
    maxScale,
    easing,
    startOpacity,
    endOpacity,
    zIndex,
    allowSecondary,
  ]);

  return null;
}
