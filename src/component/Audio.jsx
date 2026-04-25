// useAudio.js
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

/**
 * useAudio("ruta/mi-audio.mp3")
 * Controles: play, pause, stop, toggleLoop, setLoop
 * Estados: isReady, isPlaying, loop, currentTime, duration, error
 */
export default function useAudio(src) {
  const audioRef = useRef(null);

  // Estados
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  // Crea/recrea el elemento de audio cuando cambia el src
  const audio = useMemo(() => {
    const el = new Audio(src || "");
    el.preload = "auto";
    el.loop = loop; // valor inicial; se sincroniza por efecto abajo
    return el;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]); // *no* dependemos de loop para no recrear el elemento innecesariamente

  // Guarda ref y maneja eventos del elemento
  useEffect(() => {
    audioRef.current = audio;

    const onCanPlay = () => {
      setIsReady(true);
      setDuration(audio.duration || 0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onEnded = () => {
      setIsPlaying(false);
      // si no está en loop, queda en ended con currentTime al final
      setCurrentTime(audio.currentTime || 0);
    };
    const onError = () => setError(audio.error || new Error("Audio error"));

    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      // liberar referencia para GC
      audioRef.current = null;
    };
  }, [audio]);

  // Mantén el flag de loop sincronizado en el elemento
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop]);

  // Controles
  const play = useCallback(async () => {
    setError(null);
    try {
      await audioRef.current?.play();
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
    // Rewind sin disparar carga adicional
    try {
      el.currentTime = 0;
    } catch (_) {
      // algunos navegadores pueden bloquear si no está listo
    }
  }, []);

  const toggleLoop = useCallback(() => setLoop(v => !v), []);

  // API opcional adicional
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

  return {
    // estados
    isReady,
    isPlaying,
    loop,
    currentTime,
    duration,
    error,

    // controles requeridos
    play,
    pause,
    stop,
    toggleLoop,
    setLoop,

    // utilidades extra (por si te sirven)
    setCurrentTime: setCurrent,
    setVolume,
    audioRef, // acceso directo al <audio> si lo necesitas
  };
}
