// useAudio.js
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useAudio(src, { trackTime = true, timeUpdateMs = 250 } )
 * Controles:
 *   - play()       → usa un único <audio> oculto (soundtrack, loops largos)
 *   - playBurst()  → crea un nuevo Audio(src) por disparo (clics/metralleta)
 *   - pause(), stop(), toggleLoop(), setLoop()
 *
 * Estados: isReady, isPlaying, loop, currentTime, duration, error
 *
 * Móvil-safe y persistente: sin AudioContext; reintenta hasta que suene.
 * Default target ahora: #root → #container → body
 *
 * Ejemplos:
 * const s = useAudio("/mi.mp3", { trackTime: false }); // no re-renders por timeupdate
 * const s = useAudio("/mi.mp3", { timeUpdateMs: 1000 }); // 1 actualización/seg
 */
export default function useAudio(src, opts = {}) {
  const { trackTime = false, timeUpdateMs = 250 } = opts;

  const audioRef = useRef(null);
  const holderRef = useRef(null);
  const autoCleanupRef = useRef(null);

  // Estado público
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [currentTime, setCT] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  // ---- montar <audio> en DOM (una vez) ----
  useEffect(() => {
    if (typeof document !== "undefined" && !holderRef.current) {
      const holder = document.createElement("div");
      holder.style.cssText =
        "position:fixed;left:-9999px;top:-9999px;width:0;height:0;overflow:hidden;";
      holder.setAttribute("data-use-audio-holder", "");
      document.body.appendChild(holder);
      holderRef.current = holder;
    }

    const el = document.createElement("audio");
    el.preload = "auto";
    el.loop = loop;
    el.setAttribute("playsinline", "");
    if (src) el.src = src;

    holderRef.current?.appendChild(el);
    audioRef.current = el;

    const onCanPlay = () => {
      setIsReady(true);
      setDuration(el.duration || 0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCT(el.currentTime || 0);
    };
    const onError = () => setError(el.error || new Error("Audio error"));

    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);

    return () => {
      if (autoCleanupRef.current) {
        autoCleanupRef.current();
        autoCleanupRef.current = null;
      }
      try {
        el.pause();
      } catch {}
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
      el.parentNode?.removeChild(el);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- listener timeupdate con throttling y opt-out ----
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    let last = 0;
    const onTimeUpdate = () => {
      if (!trackTime) return; // opt-out: no actualiza estado -> no re-render
      const now =
        typeof performance !== "undefined" && performance.now
          ? performance.now()
          : Date.now();
      if (now - last < Math.max(0, timeUpdateMs)) return; // throttling
      last = now;
      setCT(el.currentTime || 0);
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [trackTime, timeUpdateMs]);

  // ---- actualizar src sin recrear el <audio> ----
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (src) {
      const wasPlaying = !el.paused;
      el.src = src;
      if (!wasPlaying) el.load();
    } else {
      el.removeAttribute("src");
      el.load();
    }
  }, [src]);

  // sincroniza loop
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop]);

  // ---- controles (audio principal) ----
  const play = useCallback(async () => {
    setError(null);
    try {
      const el = audioRef.current;
      if (!el) return false;

      if (el.readyState < 2) el.load();

      el.muted = false;
      if (el.volume === 0) el.volume = 1;

      await el.play();
      return true;
    } catch (e) {
      setError(e);
      return false;
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    try {
      el.currentTime = 0;
    } catch {}
  }, []);

  const toggleLoop = useCallback(() => setLoop((v) => !v), []);

  const setCurrent = useCallback((t) => {
    if (audioRef.current && Number.isFinite(t)) {
      audioRef.current.currentTime = Math.max(0, t);
    }
  }, []);

  const setVolume = useCallback((v) => {
    if (!audioRef.current) return;
    const nv = Math.min(1, Math.max(0, Number(v)));
    audioRef.current.volume = Number.isFinite(nv) ? nv : 1;
  }, []);

  // ---- disparos "metralleta": instancias nuevas de Audio(src) ----
  const playBurst = useCallback(async () => {
    setError(null);
    try {
      if (!src) return false;

      const baseVolume =
        audioRef.current && typeof audioRef.current.volume === "number"
          ? audioRef.current.volume
          : 1;

      const burst = new Audio(src);
      burst.preload = "auto";
      burst.loop = false;
      burst.muted = false;
      burst.volume = baseVolume;
      burst.currentTime = 0;

      const p = burst.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {
          // si falla por política de autoplay, lo ignoramos aquí
        });
      }

      // Limpieza básica cuando termine / tenga error (GC se encarga del resto)
      const cleanupBurst = () => {
        try {
          burst.pause();
        } catch {}
      };
      burst.addEventListener("ended", cleanupBurst, { once: true });
      burst.addEventListener("error", cleanupBurst, { once: true });

      return true;
    } catch (e) {
      setError(e);
      return false;
    }
  }, [src]);

  /**
   * automatic(options?)
   * Persistente: intenta en CADA gesto hasta que el audio principal
   * tenga éxito audible.
   *
   * Default target: #root → #container → body.
   * Eventos: inicio y fin de gesto + click/keydown.
   */
  const automatic = useCallback((opts = {}) => {
    // Rearmado limpio
    if (autoCleanupRef.current) {
      autoCleanupRef.current();
      autoCleanupRef.current = null;
    }

    let defaultTarget = null;
    if (typeof document !== "undefined") {
      defaultTarget =
        document.getElementById("root") ||
        document.getElementById("container") ||
        document.body;
    }

    const {
      target = defaultTarget,
      events = [
        "touchstart",
        "touchend",
        "touchcancel",
        "pointerdown",
        "pointerup",
        "pointercancel",
        "mousedown",
        "mouseup",
        "click",
        "keydown",
      ],
    } = opts;

    if (!target || typeof target.addEventListener !== "function")
      return () => {};

    let armed = true; // hasta éxito
    const options = { capture: true, passive: false }; // ¡sin once!

    const tryPlay = () => {
      if (!armed) return;
      const el = audioRef.current;
      if (!el) return;

      // Asegura condiciones audibles ANTES de intentar
      el.defaultMuted = false;
      el.muted = false;
      if (el.volume === 0) el.volume = 1;
      if (el.readyState < 2) el.load();

      let triedMutedFallback = false;

      const onSuccess = () => {
        // éxito definitivo: asegurar audible y limpiar
        el.muted = false;
        if (el.volume === 0) el.volume = 1;
        if (autoCleanupRef.current) autoCleanupRef.current();
        autoCleanupRef.current = null;
        armed = false;
      };

      const onFail = () => {
        // Fallback UNA sola vez: intenta muted y luego desmutear + re-play
        if (triedMutedFallback) return; // espera otro gesto
        triedMutedFallback = true;

        try {
          el.muted = true;
          const p2 = el.play(); // NO await
          if (p2 && typeof p2.then === "function") {
            p2
              .then(() => {
                // ya “desbloqueó”: desmutea y reintenta audible
                el.muted = false;
                if (el.volume === 0) el.volume = 1;
                const p3 = el.play();
                if (p3 && typeof p3.then === "function") {
                  p3.then(onSuccess).catch(() => {
                    /* espera próximo gesto */
                  });
                } else {
                  onSuccess();
                }
              })
              .catch(() => {
                /* espera próximo gesto */
              });
          } else {
            // sin Promise: asumimos éxito y hacemos audible
            el.muted = false;
            if (el.volume === 0) el.volume = 1;
            onSuccess();
          }
        } catch {
          // espera próximo gesto
        }
      };

      try {
        const p = el.play(); // NO await (mismo stack)
        if (p && typeof p.then === "function") {
          p.then(onSuccess).catch(onFail);
        } else {
          onSuccess();
        }
      } catch {
        onFail();
      }
    };

    const handler = () => tryPlay();

    const removers = events.map((ev) => {
      target.addEventListener(ev, handler, options);
      return () => target.removeEventListener(ev, handler, options);
    });

    const cleanup = () => removers.forEach((fn) => fn());
    autoCleanupRef.current = cleanup;
    return cleanup;
  }, []);

  return {
    // estados
    isReady,
    isPlaying,
    loop,
    currentTime,
    duration,
    error,

    // controles
    play,        // usa el <audio> principal (ideal soundtrack)
    playBurst,   // crea un Audio nuevo por disparo (clics/metralleta)
    pause,
    stop,
    toggleLoop,
    setLoop,

    // utilidades
    setCurrentTime: setCurrent,
    setVolume,
    audioRef,

    // autoplay persistente (default: #root → #container → body)
    automatic,
  };
}
