// WaveSpan.jsx
import React from "react";

export default function WaveSpan({
  controller = "play",       // "play" | "pause" | "stop"
  size = 60,
  color = "#FFF",
  mode = "fill",             // "fill" | "outline"
  borderWidth = 2.5,
  duration = 3000,
  interval = 700,
  maxScale = 3.0,
  startOpacity = .6,
  endOpacity = 0,
  easing = "cubic-bezier(.22,.61,.36,1)",
  shadow = "0 4px 10px rgba(0,0,0,1)",
  rounded = true,
  zIndex = 100000,
  initialDelayMs = 80,       // ⬅️ espera inicial para anclar bien

  style,
  className,
}) {
  const hostRef = React.useRef(null);     // tu <span> en árbol (no cambia tu layout)
  const overlayRef = React.useRef(null);  // overlay fixed en <body> (como en eventos)
  const intervalRef = React.useRef(null);
  const animsRef = React.useRef(new Set());
  const prefersReduced = React.useRef(false);
  const visibleRef = React.useRef(true);  // visibilidad real del host
  const readyRef = React.useRef(false);   // tras 2 frames

  // util: siguiente frame
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

  React.useEffect(() => {
    prefersReduced.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    // host inline sin ocupar caja
    const host = hostRef.current;
    if (!host) return;
    host.style.position = host.style.position || "relative";
    host.style.display = host.style.display || "inline-block";
    host.style.width = host.style.width || "0px";
    host.style.height = host.style.height || "0px";
    host.style.overflow = "visible";
    host.style.pointerEvents = host.style.pointerEvents || "none";
    host.style.contain = host.style.contain || "layout style paint";

    // overlay en body (idéntico a la versión por evento)
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = String(zIndex);
    overlay.style.contain = "layout style paint";
    overlayRef.current = overlay;
    document.body.appendChild(overlay);

    // observar visibilidad real (se pausa si el host está oculto)
    const io = new IntersectionObserver(
      (entries) => {
        visibleRef.current = Boolean(entries[0]?.isIntersecting);
        // si se volvió visible y estamos en play, las siguientes ondas irán bien ancladas
      },
      { root: null, threshold: 0 }
    );
    try { io.observe(host); } catch {}

    // reanclar en cambios globales
    const reanchor = () => {/* siguientes ondas usan el centro actualizado */};
    window.addEventListener("resize", reanchor, { passive: true });
    window.addEventListener("scroll", reanchor, { passive: true });

    // marcar "ready" tras 2 frames: evita salto inicial sin tocar tu blur
    (async () => {
      try { await document.fonts?.ready; } catch {}
      await nextFrame();
      await nextFrame();
      readyRef.current = true;
    })();

    return () => {
      window.removeEventListener("resize", reanchor);
      window.removeEventListener("scroll", reanchor);
      try { io.disconnect(); } catch {}
      stopAll();
      overlay.remove();
      overlayRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zIndex]);

  // centro actual del host (en coords de viewport)
  const getCenter = React.useCallback(() => {
    const host = hostRef.current;
    if (!host) return { x: 0, y: 0 };
    const rect = host.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  // crea una onda en overlay anclada al centro actual del host
  const createWave = React.useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay || !readyRef.current || !visibleRef.current) return;

    const { x, y } = getCenter();
    const r = size / 2;

    const ring = document.createElement("div");
    ring.style.position = "fixed";
    ring.style.left = "0";
    ring.style.top = "0";
    ring.style.width = `${size}px`;
    ring.style.height = `${size}px`;
    ring.style.borderRadius = rounded ? "50%" : "12px";
    ring.style.boxShadow = shadow;
    ring.style.willChange = "transform, opacity";
    ring.style.pointerEvents = "none";
    ring.style.opacity = String(startOpacity);
    ring.style.contain = "layout style paint";

    if (mode === "fill") {
      ring.style.background = color;
    } else {
      ring.style.background = "transparent";
      ring.style.border = `${borderWidth}px solid ${color}`;
    }

    overlay.appendChild(ring);

    const from = `translate3d(${x - r}px, ${y - r}px, 0) scale(1)`;
    const to   = `translate3d(${x - r}px, ${y - r}px, 0) scale(${maxScale})`;

    const dur = prefersReduced.current ? 0 : duration;
    const anim = ring.animate(
      [{ transform: from, opacity: startOpacity }, { transform: to, opacity: endOpacity }],
      { duration: dur, easing, fill: "forwards" }
    );

    const entry = { anim, node: ring };
    animsRef.current.add(entry);
    const finish = () => { animsRef.current.delete(entry); ring.remove(); };
    anim.addEventListener?.("finish", finish);
    entry.fallback = setTimeout(finish, dur + 80);
  }, [getCenter, size, rounded, shadow, startOpacity, mode, color, borderWidth, duration, easing, maxScale, endOpacity]);

  // controladores
  const stopAll = React.useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    for (const { anim, node, fallback } of animsRef.current) {
      try { clearTimeout?.(fallback); } catch {}
      try { anim.cancel(); } catch {}
      node.remove();
    }
    animsRef.current.clear();
  }, []);

  const pauseAll = React.useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    for (const { anim } of animsRef.current) { try { anim.pause(); } catch {} }
  }, []);

  const playAll = React.useCallback(() => {
    for (const { anim } of animsRef.current) { try { anim.play(); } catch {} }
    if (!intervalRef.current && !prefersReduced.current) {
      // dispara la primera onda apenas esté "ready" y visible, sin tocar tu blur
      const kick = () => { if (readyRef.current && visibleRef.current) createWave(); };
      // pequeño microdelay para dar chance a cualquier CSS inicial
      setTimeout(kick, 0);
      intervalRef.current = setInterval(createWave, interval);
    } else if (prefersReduced.current) {
      if (readyRef.current && visibleRef.current) createWave();
    }
  }, [createWave, interval]);

  React.useEffect(() => {
    if (controller === "stop")      stopAll();
    else if (controller === "pause") pauseAll();
    else                              playAll();

    return () => {
      if (controller !== "play" && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [controller, playAll, pauseAll, stopAll]);

  return <span ref={hostRef} className={className} style={style} aria-hidden="true" />;
}