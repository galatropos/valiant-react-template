// src/component/VideoToFramesPlayer.jsx
// Fix: al pausar, forzar un último draw y no permitir que el canvas quede negro.

import React, { useEffect, useRef, useState } from "react";
import Card from "./Card";

import useOrientationMode from "./video/useOrientationMode.js";
import useInstanceId from "./video/useInstanceId.js";
import drawToCanvas from "./video/drawToCanvas.js";
import registerDebugInstance from "./video/registerDebugInstance.js";
import TimelineManager from "./video/Manager.js";
import "./video/control.js"; // window.control
import {
  DRIFT_SOFT_MS,
  DRIFT_HARD_MS,
  HYST_AFTER_SEEK_MS,
  SYNC_NUDGE_MAX,
  SYNC_KP,
  SYNC_ZERO_BAND_MS,
  SYNC_BACKOFF_MS,
} from "./video/constants.js";
import SniperOverlay from "./video/SniperOverlay.jsx"; // opcional

function VideoToFramesPlayer({
  portrait,
  portraitSrc,
  landscape,
  landscapeSrc,
  objectFit = "cover",
  className,
  style,
  noCard = false,
  showHUD = false,
  managerAutoPlay = false,
  audioPolicy = "unmuteOnInteract",
  sniperUI = false,
}) {
  const mode = useOrientationMode();
  const showPortrait = mode === "portrait";
  const instanceId = useInstanceId("vp");

  // Manager interno
  const managerRef = useRef(null);
  if (!managerRef.current) managerRef.current = new TimelineManager({ durationMs: 0 });
  const manager = managerRef.current;

  // Debug global
  useEffect(() => registerDebugInstance(instanceId, manager), [instanceId, manager]);

  // Refs
  const vPortraitRef = useRef(null);
  const vLandscapeRef = useRef(null);
  const cPortraitRef = useRef(null);
  const cLandscapeRef = useRef(null);
  const shownVideoRef = showPortrait ? vPortraitRef : vLandscapeRef;
  const shownCanvasRef = showPortrait ? cPortraitRef : cLandscapeRef;

  // Contenedor
  const containerRef = useRef(null);

  // HUD
  const [hud, setHud] = useState(null);
  useEffect(() => {
    if (!showHUD) return;
    const id = setInterval(() => setHud(manager.getSnapshot()), 333);
    return () => clearInterval(id);
  }, [showHUD, manager]);

  // Resize → redibuja (con draw seguro que no borra si no hay frame)
  useEffect(() => {
    if (!containerRef.current) return;
    let rAF = 0;
    const ro = new ResizeObserver(() => {
      if (rAF) return;
      rAF = requestAnimationFrame(() => {
        rAF = 0;
        const v = shownVideoRef.current;
        const c = shownCanvasRef.current;
        if (v && c) drawToCanvas(v, c, objectFit);
      });
    });
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); if (rAF) cancelAnimationFrame(rAF); };
  }, [showPortrait, objectFit]);

  // Redibujo por objectFit/orientación
  useEffect(() => {
    const v = shownVideoRef.current;
    const c = shownCanvasRef.current;
    if (v && c) drawToCanvas(v, c, objectFit);
  }, [objectFit, showPortrait]);

  // Duración → manager + autoPlay opcional
  useEffect(() => {
    const vp = vPortraitRef.current;
    const vl = vLandscapeRef.current;
    if (!vp && !vl) return;

    const setDurationFrom = (videoEl) => {
      if (!videoEl) return;
      const durMs = Number.isFinite(videoEl.duration) ? Math.max(0, videoEl.duration * 1000) : 0;
      if (durMs > 0) {
        manager.setDuration(durMs);
        if (managerAutoPlay) manager.play();
      }
    };
    const onMetaP = () => setDurationFrom(vPortraitRef.current);
    const onMetaL = () => setDurationFrom(vLandscapeRef.current);

    vp?.addEventListener("loadedmetadata", onMetaP);
    vl?.addEventListener("loadedmetadata", onMetaL);
    if (vp?.readyState >= 1) onMetaP();
    if (vl?.readyState >= 1) onMetaL();
    return () => {
      vp?.removeEventListener("loadedmetadata", onMetaP);
      vl?.removeEventListener("loadedmetadata", onMetaL);
    };
  }, [manager, managerAutoPlay]);

  // Reloj usa RVFC del video visible
  useEffect(() => {
    const v = shownVideoRef.current;
    if (v) manager.setClockSource(v);
  }, [manager, showPortrait]);

  // === Sincronía suave (rate nudging) + PAUSE estático con draw inmediato ===
  const lastSeekAtRef = useRef(0);
  const lastNudgeAtRef = useRef(0);
  const desiredRateRef = useRef(1);
  const lastStateRef = useRef("paused"); // para detectar transiciones play→pause / pause→play

  useEffect(() => {
    const v = shownVideoRef.current;
    const canvas = shownCanvasRef.current;
    if (!v) return;

    let stopped = false;
    let raf = 0;

    const ensurePlay = async () => {
      try { if (v.paused) await v.play().catch(() => {}); } catch {}
    };
    const ensurePause = () => {
      try { if (!v.paused) v.pause(); } catch {}
    };

    const loop = () => {
      if (stopped) return;

      const snap = manager.getSnapshot();
      const desiredS = (snap.tMs || 0) / 1000;
      const realS = v.currentTime || 0;
      const driftMs = (realS - desiredS) * 1000;

      // Reporta drift al manager (debug)
      if (typeof manager.setVideoDrift === "function") manager.setVideoDrift(driftMs);

      const now = performance.now();
      const recentlySeeked = (now - lastSeekAtRef.current) < HYST_AFTER_SEEK_MS;

      // Detectar transición de estado para “congelar” el frame en pausa
      const prevState = lastStateRef.current;
      const curState = snap.state;
      if (prevState !== curState) {
        lastStateRef.current = curState;
        if (curState === "paused") {
          // al entrar en pausa, alinear y DIBUJAR inmediatamente
          if (Math.abs(driftMs) > SYNC_ZERO_BAND_MS && !recentlySeeked) {
            try { v.currentTime = desiredS; } catch {}
            lastSeekAtRef.current = now;
          }
          try { v.playbackRate = 1; } catch {}
          ensurePause();
          if (canvas) drawToCanvas(v, canvas, objectFit); // <- frame congelado visible
        } else {
          // al reanudar, arrancar normal
          ensurePlay();
        }
      }

      if (curState === "paused") {
        // en pausa: no nudging continuo
        if (Math.abs(driftMs) > SYNC_ZERO_BAND_MS && !recentlySeeked) {
          try { v.currentTime = desiredS; } catch {}
          lastSeekAtRef.current = now;
          if (canvas) drawToCanvas(v, canvas, objectFit); // redibuja si hubo realineo
        }
        try { v.playbackRate = 1; } catch {}
        ensurePause();
      } else {
        // PLAY: aseguramos reproducción y aplicamos nudging suave
        ensurePlay();

        if (!recentlySeeked && Math.abs(driftMs) > DRIFT_HARD_MS) {
          try { v.currentTime = desiredS; } catch {}
          lastSeekAtRef.current = now;
          desiredRateRef.current = 1;
          try { v.playbackRate = 1; } catch {}
        } else {
          const abs = Math.abs(driftMs);
          if (abs <= SYNC_ZERO_BAND_MS) {
            if (Math.abs((v.playbackRate || 1) - 1) > 0.001) {
              desiredRateRef.current = 1;
              try { v.playbackRate = 1; } catch {}
            }
          } else if (abs > DRIFT_SOFT_MS) {
            const delta = - driftMs * SYNC_KP;
            let target = 1 + delta;
            const max = 1 + SYNC_NUDGE_MAX;
            const min = 1 - SYNC_NUDGE_MAX;
            if (target > max) target = max;
            if (target < min) target = min;

            if ((now - lastNudgeAtRef.current) > SYNC_BACKOFF_MS || Math.abs(target - (v.playbackRate || 1)) > 0.01) {
              desiredRateRef.current = target;
              try { v.playbackRate = target; } catch {}
              lastNudgeAtRef.current = now;
            }
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [manager, showPortrait, objectFit]);

  // Bucle de dibujo (prefiere RVFC; si no, RAF). Autoplay del video: una sola vez.
  const isDocVisible = () => (typeof document !== "undefined" ? !document.hidden : true);
  useEffect(() => {
    const v = shownVideoRef.current;
    const canvas = shownCanvasRef.current;
    if (!v || !canvas) return;

    let stopped = false;
    let started = false;
    let rafId = 0;

    const start = async () => {
      try {
        v.muted = true; v.loop = false; v.playsInline = true;
        if (!started) { started = true; await v.play().catch(() => {}); }
      } catch {}
    };
    start();

    const hasRVFC = typeof v.requestVideoFrameCallback === "function";
    if (hasRVFC) {
      const cb = () => {
        if (stopped) return;
        if (isDocVisible()) drawToCanvas(v, canvas, objectFit);
        v.requestVideoFrameCallback(cb);
      };
      v.requestVideoFrameCallback(cb);
      return () => { stopped = true; };
    }

    const tick = () => {
      if (stopped) return;
      if (isDocVisible()) drawToCanvas(v, canvas, objectFit);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => { stopped = true; if (rafId) cancelAnimationFrame(rafId); };
  }, [showPortrait, objectFit]);

  // === Audio policy ===
  useEffect(() => { manager.setAudioPolicy?.(audioPolicy); }, [manager, audioPolicy]);
  useEffect(() => {
    if (audioPolicy !== "unmuteOnInteract") return;
    if (manager.audioUnlocked) return;
    const onGesture = () => { manager.signal("user.audioGesture"); cleanup(); };
    const cleanup = () => {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
      window.removeEventListener("touchstart", onGesture, { capture: true });
    };
    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
    window.addEventListener("touchstart", onGesture, { capture: true });
    return cleanup;
  }, [manager, audioPolicy]);
  useEffect(() => {
    const apply = () => {
      const vp = vPortraitRef.current;
      const vl = vLandscapeRef.current;
      const shouldMute = !(manager.audioUnlocked && !manager.muted);
      if (vp) vp.muted = shouldMute;
      if (vl) vl.muted = shouldMute;
    };
    apply();
    const off = manager.on("audio", apply);
    const offPolicy = manager.on("audioPolicy", apply);
    return () => { off?.(); offPolicy?.(); };
  }, [manager]);

  const content = (
    <>
      {/* videos fuente (ocultos). Sin loop. Autoplay controlado por JS */}
      <video
        ref={vPortraitRef}
        src={portraitSrc}
        muted
        playsInline
        preload={showPortrait ? "auto" : "metadata"}
        style={{ display: "none" }}
      />
      <video
        ref={vLandscapeRef}
        src={landscapeSrc}
        muted
        playsInline
        preload={!showPortrait ? "auto" : "metadata"}
        style={{ display: "none" }}
      />
      {/* canvases visibles */}
      <canvas
        ref={cPortraitRef}
        style={{ position:"absolute", inset:0, width:"100%", height:"100%", display: showPortrait ? "block" : "none" }}
      />
      <canvas
        ref={cLandscapeRef}
        style={{ position:"absolute", inset:0, width:"100%", height:"100%", display: !showPortrait ? "block" : "none" }}
      />

      {showHUD && (
        <div style={{ position:"absolute", left:8, top:8, padding:"6px 8px", background:"rgba(0,0,0,0.55)", color:"#fff", font:"12px/1.2 monospace", borderRadius:6, pointerEvents:"none", whiteSpace:"pre", maxWidth:"60%" }}>
          id: {instanceId}{"\n"}
          {hud ? (<>
            tMs: {hud.tMs}{"\n"}state: {hud.state}{"\n"}vel: {hud.velocity}
            {"\n"}clock: {hud.clock.type} (dt≈{Math.round(hud.clock.lastDtMs)}ms)
            {"\n"}durMs: {hud.durationMs ?? "?"}{"\n"}muted: {String(hud.muted)} / unlocked: {String(hud.audioUnlocked)}
            {"\n"}driftMs: {hud.video?.driftMs ?? 0}
          </>) : "…"}
        </div>
      )}

      {sniperUI && (
        <SniperOverlay manager={manager} instanceId={instanceId} />
      )}
    </>
  );
  const body = (
    <div
      ref={containerRef}
      className={className}
      style={{ position:"relative", overflow:"hidden", width:"100%", height:"100%", background:"black", ...style }}
    >
      {content}
    </div>
  );

  if (noCard) return body;

  return (
    <Card className={className} style={style} landscape={landscape} portrait={portrait} controlsAnimate="play">
      {body}
    </Card>
  );
}

export default VideoToFramesPlayer;
