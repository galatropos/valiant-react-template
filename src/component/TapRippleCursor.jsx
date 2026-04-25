// TapRippleCursor.jsx
import React from "react";

export default function TapRippleCursor({
  size = 56,             // diámetro del círculo
  color = "#fff",
  opacity = 0.9,         // opacidad mientras está presionado
  shadow = "0 2px 10px rgba(0,0,0,.15)", // pon "none" para máximo rendimiento
  fadeDuration = 140,    // ms al soltar
  popInDuration = 100,   // ms del pop-in inicial
  smoothing = 0.35,      // 0..1: cuánto sigue el cursor por frame (más alto = más pegado)
  zIndex = 99999,
}) {
  const containerRef = React.useRef(null);
  // pointerId -> { el, x, y, tx, ty, alive }
  const pointers = React.useRef(new Map());
  const rafRef = React.useRef(null);
  const r = size / 2;

  React.useEffect(() => {
    // capa fija en body
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.inset = "0";
    container.style.pointerEvents = "none";
    container.style.zIndex = String(zIndex);
    containerRef.current = container;
    document.body.appendChild(container);

    const setPos = (node, x, y, scale = 1) => {
      node.style.transform = `translate3d(${x - r}px, ${y - r}px, 0) scale(${scale})`;
    };

    const createCircle = (x, y, id) => {
      const el = document.createElement("div");
      el.style.border = "1px solid #969696";
      el.style.position = "fixed";
      el.style.left = "0";
      el.style.top = "0";
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = "50%";
      el.style.background = color;
      el.style.opacity = "0";
      el.style.boxShadow = shadow;
      el.style.willChange = "transform, opacity";
      el.style.transition = `opacity ${popInDuration}ms ease, transform ${popInDuration}ms ease`;
      // evita efectos de stacking costosos
      el.style.contain = "layout style paint";
      container.appendChild(el);

      // estado inicial
      const data = { el, x, y, tx: x, ty: y, alive: true };
      pointers.current.set(id, data);

      // pop-in
      setPos(el, x, y, 0.9);
      void el.offsetWidth;
      el.style.opacity = String(opacity);
      setPos(el, x, y, 1);

      // arranca loop si no está corriendo
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    const removeCircle = (id) => {
      const data = pointers.current.get(id);
      if (!data || !data.alive) return;
      data.alive = false;

      const { el } = data;
      el.style.transition = `opacity ${fadeDuration}ms ease, transform ${fadeDuration}ms ease`;
      el.style.opacity = "0";
      const m = /translate3d\([^)]+\)/.exec(el.style.transform);
      el.style.transform = (m ? m[0] : "translate3d(0,0,0)") + " scale(0.95)";

      const cleanup = () => {
        el.removeEventListener("transitionend", cleanup);
        if (el.parentNode) el.parentNode.removeChild(el);
      };
      el.addEventListener("transitionend", cleanup);
      setTimeout(cleanup, fadeDuration + 80);

      // no lo quitamos del Map aún para que el RAF pueda terminar su frame sin leer null
      setTimeout(() => pointers.current.delete(id), fadeDuration + 100);
    };

    const onPointerDown = (e) => {
      createCircle(e.clientX, e.clientY, e.pointerId);
    };

    const onPointerMove = (e) => {
      const data = pointers.current.get(e.pointerId);
      if (!data || !data.alive) return;
      // solo actualizamos destino; el RAF hace el render
      data.tx = e.clientX;
      data.ty = e.clientY;
    };

    const onPointerUp = (e) => removeCircle(e.pointerId);
    const onPointerCancel = (e) => removeCircle(e.pointerId);
    const onBlur = () => {
      for (const id of Array.from(pointers.current.keys())) removeCircle(id);
    };

    const tick = () => {
      let anyAlive = false;
      for (const data of pointers.current.values()) {
        const { el } = data;
        if (!el) continue;

        // si sigue vivo, hay que seguir animando
        if (data.alive) anyAlive = true;

        // lerp hacia el destino
        data.x += (data.tx - data.x) * smoothing;
        data.y += (data.ty - data.y) * smoothing;

        // pinta
        setPos(el, data.x, data.y, 1);
      }
      // continúa el loop si hay algo vivo
      rafRef.current = anyAlive ? requestAnimationFrame(tick) : null;
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerCancel, { passive: true });
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("blur", onBlur);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      for (const { el } of pointers.current.values()) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }
      pointers.current.clear();
      if (container.parentNode) container.parentNode.removeChild(container);
    };
  }, [size, color, opacity, shadow, fadeDuration, popInDuration, smoothing, zIndex]);

  return null;
}
