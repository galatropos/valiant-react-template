import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "./Card";

/** Hook de orientación: "portrait" | "landscape" */
function useOrientationMode() {
  const getIsPortrait = () => {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      return window.matchMedia("(orientation: portrait)").matches;
    }
    return typeof window !== "undefined"
      ? window.innerHeight >= window.innerWidth
      : true;
  };
  const [mode, setMode] = useState(getIsPortrait() ? "portrait" : "landscape");
  useEffect(() => {
    const onChange = () => setMode(getIsPortrait() ? "portrait" : "landscape");
    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener?.("change", onChange);
    mq.addListener?.(onChange);
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);
    return () => {
      mq.removeEventListener?.("change", onChange);
      mq.removeListener?.(onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, []);
  return mode;
}

/**
 * Reglas repeat:
 *  - [ms, "pauseEvent"]
 *  - [ms, "pauseEvent", callback]
 *  - [ms, "pauseEvent", durationMs, callback]
 *  - [ms, "pause"]               // 🔥 NUEVO: pausa infinita, no se libera con click
 *  - [ms, "pause", callback]     // 🔥 NUEVO: igual, pero disparando callback al entrar
 *
 *  - [triggerMs, targetMs, "next", callback]
 *  - [triggerMs, targetMs, count:number, callback]
 *  - [triggerMs, targetMs, "end", callback]
 */
export default function VideoToFramesPlayer({
  portrait,
  portraitSrc,
  landscape,
  landscapeSrc,
  repeat = [],
  posterPortrait,
  posterLandscape,
  objectFit = "cover",
  autoPlay = true,
  loop = true,
  muted = true,
  volume = 1, // 👈 NUEVO: volumen 0–1
  preloadHidden = "metadata",
  className,
  style,
  noCard = false,
  velocity = 1,

  // 👉 RESET: boolean o token; al activarse, reinicia a 0 y da play
  reset = false,

  // 👉 PAUSE: boolean o token; al activarse, pausa y mantiene el frame
  pause = false,

  // API imperativo opcional
  onApi, // (api) => void
}) {
  const mode = useOrientationMode();
  const showPortrait = mode === "portrait";

  // Velocidad
  const rateRef = useRef(1);
  rateRef.current = Math.max(0.1, Number.isFinite(+velocity) ? +velocity : 1);

  // Refs video / canvas
  const vPortraitRef = useRef(null);
  const vLandscapeRef = useRef(null);
  const cPortraitRef = useRef(null);
  const cLandscapeRef = useRef(null);

  const shownVideoRef = showPortrait ? vPortraitRef : vLandscapeRef;
  const hiddenVideoRef = showPortrait ? vLandscapeRef : vPortraitRef;
  const shownCanvasRef = showPortrait ? cPortraitRef : cLandscapeRef;

  // Contenedor e interacción
  const containerRef = useRef(null);
  const userInteractedRef = useRef(false);

  // Reglas
  const rulesInitialRef = useRef([]);
  const rulesStateRef = useRef([]);
  const activeNextRef = useRef(null);

  const resetRuleCounts = () => {
    rulesStateRef.current = rulesInitialRef.current.map((r) => ({
      ...r,
      remaining: r.remaining,
      hasFiredCb: false,
    }));
    activeNextRef.current = null;
  };

  useEffect(() => {
    const normalizeCallbacks = (cbMaybe) => {
      if (typeof cbMaybe === "function") return [cbMaybe];
      if (Array.isArray(cbMaybe)) return cbMaybe.filter((fn) => typeof fn === "function");
      return [];
    };

    const normalizeRule = (tuple) => {
      if (!Array.isArray(tuple) || tuple.length < 2) return null;

      const token1 = typeof tuple[1] === "string" ? tuple[1].toLowerCase() : "";

      // 🔥 NUEVO: modo "pause" — pausa infinita, no liberable con click
      if (token1 === "pause") {
        const triggerMs = Math.max(0, Number(tuple[0]) || 0);
        let callbacks = [];
        if (tuple.length >= 3) {
          callbacks = normalizeCallbacks(tuple[2]);
        }
        return {
          mode: "pause",
          triggerMs,
          durationMs: 0,
          callbacks,
          remaining: 1,
          hasFiredCb: false,
        };
      }

      // pauseEvent (viejo comportamiento: pausa infinita pero se libera con click)
      if (token1 === "pauseevent") {
        const triggerMs = Math.max(0, Number(tuple[0]) || 0);
        let durationMs = 0;
        let callbacks = [];

        if (tuple.length === 3) {
          callbacks = normalizeCallbacks(tuple[2]);
        } else if (tuple.length >= 4) {
          durationMs = Math.max(0, Number(tuple[2]) || 0);
          callbacks = normalizeCallbacks(tuple[3]);
        }
        return {
          mode: "pauseEvent",
          triggerMs,
          durationMs,
          callbacks,
          remaining: 1,
          hasFiredCb: false,
        };
      }

      // next / count / end∞
      const triggerMs = Math.max(0, Number(tuple[0]) || 0);
      const targetMs = Math.max(0, Number(tuple[1]) || 0);
      const ctrl = tuple[2];
      const callbacks = normalizeCallbacks(tuple[3]);

      if (typeof ctrl === "string") {
        const ctrlLow = ctrl.toLowerCase();
        if (ctrlLow === "next") {
          return {
            mode: "next",
            triggerMs,
            targetMs,
            remaining: Number.POSITIVE_INFINITY,
            callbacks,
            hasFiredCb: false,
          };
        }
        if (ctrlLow === "end") {
          return {
            mode: "end",
            triggerMs,
            targetMs,
            remaining: Number.POSITIVE_INFINITY,
            callbacks,
            hasFiredCb: false,
          };
        }
      }

      const n = Number(ctrl);
      const remaining = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
      return {
        mode: "count",
        triggerMs,
        targetMs,
        remaining,
        callbacks,
        hasFiredCb: false,
      };
    };

    const rules = (Array.isArray(repeat) ? repeat : [])
      .map(normalizeRule)
      .filter(Boolean)
      .sort((a, b) => a.triggerMs - b.triggerMs);

    rulesInitialRef.current = rules;
    resetRuleCounts();
  }, [repeat]);

  // Pausas / holds
  const pauseEventHoldRef = useRef(null); // { atMs, callbacks?, permanent? }
  const tempHoldsRef = useRef([]); // [{ holdAtMs, holdEndAt, hasFiredCb, callbacks }]

  const startTempPause = (atMs, durationMs, callbacks = []) => {
    if (!durationMs) return;
    const now = performance.now();
    if (callbacks?.length) for (const fn of callbacks) { try { fn?.(); } catch {} }
    tempHoldsRef.current.push({
      holdAtMs: atMs,
      holdEndAt: now + durationMs,
      hasFiredCb: true,
      callbacks,
    });
  };

  // estilos
  const canvasStyle = useMemo(
    () => ({
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      display: "block",
      ...style,
    }),
    [style]
  );

  const containerStyle = useMemo(
    () => ({
      position: "relative",
      overflow: "hidden",
      width: "100%",
      height: "100%",
      background: "black",
      touchAction: "manipulation",
      WebkitTapHighlightColor: "transparent",
      userSelect: "none",
      ...style,
    }),
    [style]
  );

  // sincronizar al rotar + autoplay
  const prevMsRef = useRef(0);
  useEffect(() => {
    const vShow = shownVideoRef.current;
    const vHide = hiddenVideoRef.current;
    if (!vShow || !vHide) return;

    const desired = vHide.currentTime || 0;
    const ensureMeta = (vv) =>
      new Promise((res) => {
        if (vv.readyState >= 1) return res();
        const on = () => {
          vv.removeEventListener("loadedmetadata", on);
          res();
        };
        vv.addEventListener("loadedmetadata", on, { once: true });
      });

    ensureMeta(vShow).then(() => {
      try {
        const dur = isFinite(vShow.duration) ? vShow.duration : desired;
        vShow.currentTime = Math.min(desired, Math.max(0, (dur || 0) - 0.001));
      } catch {}
      try {
        vShow.playbackRate = rateRef.current;
      } catch {}
      if (autoPlay) vShow.play?.().catch?.(() => {});
      prevMsRef.current = (desired || 0) * 1000;
    });
  }, [mode, autoPlay]);

  // playbackRate
  useEffect(() => {
    const r = rateRef.current;
    try {
      if (vPortraitRef.current) vPortraitRef.current.playbackRate = r;
    } catch {}
    try {
      if (vLandscapeRef.current) vLandscapeRef.current.playbackRate = r;
    } catch {}
  }, [velocity]);

  // 🔊 VOLUMEN: aplica a ambos videos
  useEffect(() => {
    const vol = Math.min(1, Math.max(0, Number(volume) || 0));
    try {
      if (vPortraitRef.current) vPortraitRef.current.volume = vol;
    } catch {}
    try {
      if (vLandscapeRef.current) vLandscapeRef.current.volume = vol;
    } catch {}
  }, [volume]);

  // draw
  const drawToCanvas = (video, canvas) => {
    if (!video || !canvas) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;

    const dpr = window.devicePixelRatio || 1;
    if (
      canvas.width !== Math.floor(cw * dpr) ||
      canvas.height !== Math.floor(ch * dpr)
    ) {
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const vw = video.videoWidth || 1;
    const vh = video.videoHeight || 1;
    const scale =
      objectFit === "contain"
        ? Math.min(cw / vw, ch / vh)
        : Math.max(cw / vw, ch / vh);
    const dw = Math.max(1, Math.floor(vw * scale));
    const dh = Math.max(1, Math.floor(vh * scale));
    const dx = Math.floor((cw - dw) / 2);
    const dy = Math.floor((ch - dh) / 2);

    ctx.clearRect(0, 0, cw, ch);
    try {
      ctx.drawImage(video, dx, dy, dw, dh);
    } catch {}
  };

  // resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      const v = shownVideoRef.current;
      const c = shownCanvasRef.current;
      if (v && c) drawToCanvas(v, c);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [showPortrait, objectFit]);

  // redibujo si cambia objectFit / orientación
  useEffect(() => {
    const v = shownVideoRef.current;
    const c = shownCanvasRef.current;
    if (v && c) drawToCanvas(v, c);
  }, [objectFit, showPortrait]);

  // 👉 RESET: función centralizada
  const hardResetAndPlay = () => {
    try {
      resetRuleCounts();
      pauseEventHoldRef.current = null;
      tempHoldsRef.current = [];
      userInteractedRef.current = false;
      activeNextRef.current = null;

      if (vPortraitRef.current) vPortraitRef.current.currentTime = 0;
      if (vLandscapeRef.current) vLandscapeRef.current.currentTime = 0;

      const v = shownVideoRef.current;
      const c = shownCanvasRef.current;
      prevMsRef.current = 0;

      if (v) {
        v.muted = muted;
        v.playsInline = true;
        v.playbackRate = rateRef.current;
        v.play?.().catch?.(() => {});
      }
      if (v && c) drawToCanvas(v, c);
    } catch {}
  };

  // 🔔 Disparar reset por prop `reset`
  const lastResetRef = useRef(undefined);
  useEffect(() => {
    const val = reset;
    const changed =
      (typeof val === "boolean" && val === true && lastResetRef.current !== true) ||
      (typeof val === "number" && val !== lastResetRef.current) ||
      (typeof val === "string" && val !== lastResetRef.current);

    if (changed) {
      hardResetAndPlay();
    }
    lastResetRef.current = val;
  }, [reset]);

  // 👉 PAUSE: efecto que pausa cuando `pause` se activa / cambia
  const lastPauseRef = useRef(undefined);
  useEffect(() => {
    const val = pause;
    const changed =
      (typeof val === "boolean" && val === true && lastPauseRef.current !== true) ||
      (typeof val === "number" && val !== lastPauseRef.current) ||
      (typeof val === "string" && val !== lastPauseRef.current);

    if (changed) {
      const v = shownVideoRef.current;
      const c = shownCanvasRef.current;
      try {
        v?.pause?.();
      } catch {}
      if (v && c) drawToCanvas(v, c); // asegurar frame visible
    }
    lastPauseRef.current = val;
  }, [pause, showPortrait]); // si cambia de orientación, mantenemos el frame pausado

  // 🧰 API imperativo
  useEffect(() => {
    if (typeof onApi !== "function") return;
    const api = {
      reset: hardResetAndPlay,
      play: () => shownVideoRef.current?.play?.(),
      pause: () => shownVideoRef.current?.pause?.(),
      seekMs: (ms) => {
        const v = shownVideoRef.current;
        const c = shownCanvasRef.current;
        const m = Math.max(0, Number(ms) || 0);
        try {
          if (v) v.currentTime = m / 1000;
        } catch {}
        prevMsRef.current = m;
        if (v && c) drawToCanvas(v, c);
      },
      // 🔊 NUEVO: control de volumen desde afuera
      setVolume: (vol) => {
        const clamped = Math.min(1, Math.max(0, Number(vol) || 0));
        try {
          if (vPortraitRef.current) vPortraitRef.current.volume = clamped;
        } catch {}
        try {
          if (vLandscapeRef.current) vLandscapeRef.current.volume = clamped;
        } catch {}
      },
    };
    onApi(api);
  }, [onApi, showPortrait]);

  // interacción (sin reset/pause por click)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let lastStamp = -1;
    const onPrimaryDown = (e) => {
      try {
        e.preventDefault();
      } catch {}
      try {
        e.stopPropagation();
      } catch {}

      const ts = e.timeStamp ?? performance.now();
      if (ts === lastStamp) return;
      lastStamp = ts;

      // liberar pauseEvent infinito si existe (pero NO si es "pause" permanente)
      if (pauseEventHoldRef.current) {
        const hold = pauseEventHoldRef.current;
        if (Array.isArray(hold.callbacks)) {
          for (const fn of hold.callbacks) {
            try {
              fn?.();
            } catch {}
          }
        }
        // solo liberar si NO es pausa permanente
        if (!hold.permanent) {
          pauseEventHoldRef.current = null;
        }
        return;
      }

      // si estamos en tramo END => callback inmediato
      const v = shownVideoRef.current;
      const tMs = (v?.currentTime || 0) * 1000;
      const EPS = 0.75;
      const rEnd = rulesStateRef.current.find(
        (r) =>
          r.mode === "end" &&
          tMs + EPS >= Math.min(r.targetMs, r.triggerMs) &&
          tMs - EPS < Math.max(r.targetMs, r.triggerMs)
      );
      if (rEnd && Array.isArray(rEnd.callbacks)) {
        for (const fn of rEnd.callbacks) {
          try {
            fn?.();
          } catch {}
        }
        return;
      }

      // marcar interacción para NEXT
      userInteractedRef.current = true;
    };

    let remove = () => {};
    if ("onpointerdown" in window) {
      el.addEventListener("pointerdown", onPrimaryDown, {
        passive: false,
        capture: true,
      });
      remove = () =>
        el.removeEventListener("pointerdown", onPrimaryDown, { capture: true });
    } else if ("ontouchstart" in window) {
      el.addEventListener("touchstart", onPrimaryDown, {
        passive: false,
        capture: true,
      });
      remove = () =>
        el.removeEventListener("touchstart", onPrimaryDown, { capture: true });
    } else {
      el.addEventListener("mousedown", onPrimaryDown, {
        passive: false,
        capture: true,
      });
      remove = () =>
        el.removeEventListener("mousedown", onPrimaryDown, { capture: true });
    }

    return remove;
  }, []);

  // lock tras seek
  const seekLockRef = useRef(false);
  const seekLockUntilRef = useRef(0);

  const runCallbacksOnce = (r) => {
    if (!r || r.hasFiredCb) return;
    if (Array.isArray(r.callbacks) && r.callbacks.length) {
      for (const fn of r.callbacks) {
        try {
          fn?.();
        } catch {}
      }
    }
    r.hasFiredCb = true;
  };

  // loop principal
  const rafRef = useRef(null);
  useEffect(() => {
    const v = shownVideoRef.current;
    const canvas = shownCanvasRef.current;
    if (!v || !canvas) return;

    let stopped = false;
    const hasRVFC = typeof v.requestVideoFrameCallback === "function";

    const tryPlay = async () => {
      try {
        v.muted = muted;
        v.playsInline = true;
        v.playbackRate = rateRef.current;
        if (autoPlay) await v.play();
      } catch {}
    };
    tryPlay();

    const detectAndResetOnWrap = (tMs) => {
      if (!loop) return;
      const durSec = isFinite(v.duration) ? v.duration : NaN;
      const durMs = isFinite(durSec) ? durSec * 1000 : NaN;
      if (!isFinite(durMs)) return;
      const prev = prevMsRef.current;
      const nearStart = tMs < 250;
      const nearEnd = prev > durMs - 400;
      const wrapped = prev > tMs + 100 && nearStart && nearEnd;
      if (wrapped) {
        rulesInitialRef.current && resetRuleCounts();
        pauseEventHoldRef.current = null;
        tempHoldsRef.current = [];
      }
    };

    const consumeUserInteraction = () => {
      if (!userInteractedRef.current) return false;
      userInteractedRef.current = false;

      const tMsNow = (v.currentTime || 0) * 1000;

      const rActive = activeNextRef.current;
      if (rActive && rActive.mode === "next" && rActive.remaining > 0) {
        rActive.remaining = 0;
        try {
          v.currentTime = (rActive.triggerMs || 0) / 1000;
        } catch {}
        prevMsRef.current = rActive.triggerMs || 0;
        runCallbacksOnce(rActive);
        activeNextRef.current = null;
        seekLockRef.current = true;
        seekLockUntilRef.current = performance.now() + 16;
        return true;
      }

      let candidate = null;
      for (const r of rulesStateRef.current) {
        if (r.mode !== "next" || r.remaining <= 0) continue;
        if (r.triggerMs >= tMsNow) {
          if (!candidate || r.triggerMs < candidate.triggerMs) candidate = r;
        }
      }
      if (candidate) {
        candidate.remaining = 0;
        try {
          v.currentTime = (candidate.triggerMs || 0) / 1000;
        } catch {}
        prevMsRef.current = candidate.triggerMs || 0;
        runCallbacksOnce(candidate);
        seekLockRef.current = true;
        seekLockUntilRef.current = performance.now() + 16;
        return true;
      }
      return false;
    };

    const handleProgressAndDraw = () => {
      if (seekLockRef.current) {
        if (performance.now() >= seekLockUntilRef.current)
          seekLockRef.current = false;
        drawToCanvas(v, canvas);
        return;
      }

      const tMs = (v.currentTime || 0) * 1000;
      detectAndResetOnWrap(tMs);

      const now = performance.now();

      // limpiar pausas temporales expiradas
      if (tempHoldsRef.current.length) {
        tempHoldsRef.current = tempHoldsRef.current.filter(
          (p) => now < p.holdEndAt
        );
      }

      // pauseEvent hold infinito / pausa permanente
      if (pauseEventHoldRef.current) {
        const holdMs = pauseEventHoldRef.current.atMs || 0;
        try {
          v.currentTime = holdMs / 1000;
        } catch {}
        prevMsRef.current = holdMs;
        drawToCanvas(v, canvas);
        return;
      }

      // pausa temporal activa
      const tempHold = tempHoldsRef.current.find((p) => p.holdEndAt > now);
      if (tempHold) {
        const holdSec = (tempHold.holdAtMs || 0) / 1000;
        try {
          v.currentTime = holdSec;
        } catch {}
        prevMsRef.current = tempHold.holdAtMs || tMs;
        drawToCanvas(v, canvas);
        return;
      }

      // interacción para NEXT
      const jumped = consumeUserInteraction();
      if (jumped) {
        drawToCanvas(v, canvas);
        return;
      }

      // pauseEvent / pause (crea hold)
      const prev = prevMsRef.current;
      for (const r of rulesStateRef.current) {
        if ((r.mode !== "pauseEvent" && r.mode !== "pause") || r.remaining <= 0)
          continue;
        if (prev < r.triggerMs && tMs >= r.triggerMs) {
          r.remaining = 0;
          if (!r.durationMs || r.durationMs <= 0) {
            pauseEventHoldRef.current = {
              atMs: r.triggerMs,
              callbacks: r.callbacks || [],
              permanent: r.mode === "pause", // 🔥 clave
            };
            try {
              v.currentTime = (r.triggerMs || 0) / 1000;
            } catch {}
            prevMsRef.current = r.triggerMs;
            drawToCanvas(v, canvas);
            return;
          } else {
            startTempPause(r.triggerMs, r.durationMs, r.callbacks);
            try {
              v.currentTime = (r.triggerMs || 0) / 1000;
            } catch {}
            prevMsRef.current = r.triggerMs;
            drawToCanvas(v, canvas);
            return;
          }
        }
      }

      // REPEAT (next / count / end∞)
      for (const r of rulesStateRef.current) {
        if (r.remaining <= 0) continue;

        if (r.mode === "next") {
          if (prev < r.triggerMs && tMs >= r.triggerMs) {
            try {
              v.currentTime = r.targetMs / 1000;
            } catch {}
            activeNextRef.current = r;
            prevMsRef.current = r.targetMs;
            drawToCanvas(v, canvas);
            return;
          }
        } else if (r.mode === "count") {
          if (prev < r.triggerMs && tMs >= r.triggerMs) {
            try {
              v.currentTime = r.targetMs / 1000;
            } catch {}
            r.remaining -= 1;
            prevMsRef.current = r.targetMs;
            drawToCanvas(v, canvas);
            return;
          }
        } else if (r.mode === "end") {
          if (prev < r.triggerMs && tMs >= r.triggerMs) {
            try {
              v.currentTime = r.targetMs / 1000;
            } catch {}
            prevMsRef.current = r.targetMs;
            drawToCanvas(v, canvas);
            return;
          }
        }
      }

      prevMsRef.current = tMs;
      drawToCanvas(v, canvas);
    };

    if (hasRVFC) {
      const cb = () => {
        if (stopped) return;
        try {
          v.playbackRate = rateRef.current;
        } catch {}
        handleProgressAndDraw();
        v.requestVideoFrameCallback(cb);
      };
      v.requestVideoFrameCallback(cb);
      return () => {
        stopped = true;
      };
    }

    // Fallback RAF
    let lastTs = null;
    const tick = (ts) => {
      if (stopped) return;

      if (autoPlay && !v.paused && !v.ended) {
        try {
          v.playbackRate = rateRef.current;
        } catch {}

        const now = performance.now();
        tempHoldsRef.current = tempHoldsRef.current.filter(
          (p) => now < p.holdEndAt
        );

        if (pauseEventHoldRef.current) {
          try {
            v.currentTime =
              (pauseEventHoldRef.current.atMs || 0) / 1000;
          } catch {}
          drawToCanvas(v, canvas);
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        const tHold = tempHoldsRef.current.find((p) => p.holdEndAt > now);
        if (tHold) {
          try {
            v.currentTime = (tHold.holdAtMs || 0) / 1000;
          } catch {}
          drawToCanvas(v, canvas);
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        if (seekLockRef.current) {
          if (performance.now() >= seekLockUntilRef.current)
            seekLockRef.current = false;
          drawToCanvas(v, canvas);
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        if (lastTs == null) lastTs = ts;
        let next =
          (v.currentTime || 0) +
          ((ts - lastTs) / 1000) * rateRef.current;
        lastTs = ts;

        const nextMs = next * 1000;
        const prev = prevMsRef.current;

        // pauseEvent / pause
        for (const r of rulesStateRef.current) {
          if ((r.mode !== "pauseEvent" && r.mode !== "pause") || r.remaining <= 0)
            continue;
          if (prev < r.triggerMs && nextMs >= r.triggerMs) {
            r.remaining = 0;
            if (!r.durationMs || r.durationMs <= 0) {
              pauseEventHoldRef.current = {
                atMs: r.triggerMs,
                callbacks: r.callbacks || [],
                permanent: r.mode === "pause",
              };
              next = r.triggerMs / 1000;
              prevMsRef.current = r.triggerMs;
            } else {
              startTempPause(r.triggerMs, r.durationMs, r.callbacks);
              next = r.triggerMs / 1000;
              prevMsRef.current = r.triggerMs;
            }
            break;
          }
        }

        // REPEAT (next / count / end∞)
        let jumpedRepeat = false;
        for (const r of rulesStateRef.current) {
          if (r.remaining <= 0) continue;

          if (r.mode === "next") {
            if (prev < r.triggerMs && nextMs >= r.triggerMs) {
              next = r.targetMs / 1000;
              activeNextRef.current = r;
              prevMsRef.current = r.targetMs;
              jumpedRepeat = true;
              break;
            }
          } else if (r.mode === "count") {
            if (prev < r.triggerMs && nextMs >= r.triggerMs) {
              next = r.targetMs / 1000;
              r.remaining -= 1;
              prevMsRef.current = r.targetMs;
              jumpedRepeat = true;
              break;
            }
          } else if (r.mode === "end") {
            if (prev < r.triggerMs && nextMs >= r.triggerMs) {
              next = r.targetMs / 1000; // 11400 → 10100...
              prevMsRef.current = r.targetMs;
              jumpedRepeat = true;
              break;
            }
          }
        }
        if (!jumpedRepeat) prevMsRef.current = nextMs;

        // envolver normal
        const dur = isFinite(v.duration) ? v.duration : 0;
        if (loop) {
          if (next >= dur) {
            next = 0;
            resetRuleCounts();
            pauseEventHoldRef.current = null;
            tempHoldsRef.current = [];
          }
        } else if (!loop) {
          if (dur > 0 && next >= dur) next = Math.max(0, dur - 0.001);
        }

        try {
          v.currentTime = next;
        } catch {}
        drawToCanvas(v, canvas);
      } else {
        drawToCanvas(v, canvas);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (hasRVFC) {
      const cb = () => {
        if (stopped) return;
        try {
          v.playbackRate = rateRef.current;
        } catch {}
        handleProgressAndDraw();
        v.requestVideoFrameCallback(cb);
      };
      v.requestVideoFrameCallback(cb);
      return () => {
        stopped = true;
      };
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [showPortrait, autoPlay, loop, muted, objectFit, velocity]);

  // redibujo extra al resize
  useEffect(() => {
    const onResize = () => {
      const v = shownVideoRef.current;
      const c = shownCanvasRef.current;
      if (v && c) drawToCanvas(v, c);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [showPortrait, objectFit]);

  const content = (
    <>
      {/* videos fuente (ocultos) */}
      <video
        ref={vPortraitRef}
        src={portraitSrc}
        poster={posterPortrait}
        muted={muted}
        playsInline
        loop={loop}
        preload={showPortrait ? "auto" : preloadHidden}
        style={{ display: "none" }}
      />
      <video
        ref={vLandscapeRef}
        src={landscapeSrc}
        poster={posterLandscape}
        muted={muted}
        playsInline
        loop={loop}
        preload={!showPortrait ? "auto" : preloadHidden}
        style={{ display: "none" }}
      />

      {/* canvas visibles */}
      <canvas
        ref={cPortraitRef}
        style={{ ...canvasStyle, display: showPortrait ? "block" : "none" }}
      />
      <canvas
        ref={cLandscapeRef}
        style={{ ...canvasStyle, display: !showPortrait ? "block" : "none" }}
      />
    </>
  );

  if (noCard) {
    return (
      <div ref={containerRef} className={className} style={containerStyle}>
        {content}
      </div>
    );
  }

  return (
    <Card
      className={className}
      style={style}
      landscape={landscape}
      portrait={portrait}
      controlsAnimate="play"
      loop={true}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          ...style,
        }}
        ref={containerRef}
      >
        {content}
      </div>
    </Card>
  );
}
