// VideoTimelineHost.jsx — NO importa Manager ni Sniper: todo llega por props
import React, { useEffect, useRef } from "react";

/**
 * Props esperadas:
 * - Manager:      clase/constructor del TimelineManager (obligatorio)
 * - attachSniper: función para exponer control por consola (opcional)
 * - name:         nombre global para el sniper en window (default "ctl1")
 * - durationMs:   duración total del timeline en ms (default 30000)
 * - blocks:       arreglo de bloques normalizados (default [])
 * - useVideoClock: si true, vincula un <video> como reloj (default true)
 * - autoPlay:     si true, arranca play() tras cargar (default true)
 * - style:        estilos para el contenedor (opcional)
 * - onReady:      callback(mgr) cuando el manager está listo (opcional)
 */
export default function VideoTimelineHost({
  Manager,
  attachSniper,
  name = "ctl1",
  durationMs = 30000,
  blocks = [],
  useVideoClock = true,
  autoPlay = true,
  style,
  onReady,
}) {
  const videoRef = useRef(null);
  const mgrRef = useRef(null);
  const sniperRef = useRef(null);

  useEffect(() => {
    if (!Manager) {
      console.error("VideoTimelineHost: falta props.Manager (TimelineManager)");
      return;
    }

    // 1) Instanciar manager
    const mgr = new Manager({ durationMs: Math.max(0, Math.floor(durationMs)) });
    mgrRef.current = mgr;

    // 2) Vincular reloj a <video> si aplica
    if (useVideoClock && videoRef.current && typeof mgr.setClockSource === "function") {
      mgr.setClockSource(videoRef.current);
    }

    // 3) Cargar bloques (si vienen)
    if (Array.isArray(blocks) && blocks.length > 0 && typeof mgr.loadBlocks === "function") {
      mgr.loadBlocks(blocks);
    }

    // 4) Posicionar al inicio
    if (typeof mgr.seek === "function") mgr.seek(0);

    // 5) AutoPlay (opcional)
    if (autoPlay && typeof mgr.play === "function") mgr.play();

    // 6) Sniper opcional
    if (attachSniper && typeof attachSniper === "function") {
      sniperRef.current = attachSniper(mgr, name, { log: true });
    }

    // 7) Avisar al padre que está listo
    try { onReady?.(mgr); } catch {}

    // Limpieza
    return () => {
      try { sniperRef.current?.detach?.(); } catch {}
      try { mgr.pause?.(); } catch {}
    };
  }, [Manager, attachSniper, name, durationMs, JSON.stringify(blocks), useVideoClock, autoPlay]);

  // Gestos: traducir pointer a pressStart/pressEnd (para hold)
  const onPointerDown = () => mgrRef.current?.signal?.("pressStart");
  const onPointerUp = () => mgrRef.current?.signal?.("pressEnd");
  const onPointerCancel = () => mgrRef.current?.signal?.("pressEnd");
  const onPointerLeave = () => mgrRef.current?.signal?.("pressEnd");

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        background: "#000",
        ...(style || {}),
      }}
    >
      {/* El <video> es opcional. Sirve como fuente de reloj si useVideoClock=true */}
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        style={{ width: 320, height: 180, background: "#111" }}
        // src="(opcional) tu.mp4"
      />
      <div style={{ color: "#fff", marginTop: 12, fontFamily: "system-ui, sans-serif" }}>
        Mantén presionado para probar <b>hold</b>. Consola: <code>{name}.info()</code>
      </div>
    </div>
  );
}
