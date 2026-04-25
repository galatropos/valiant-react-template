// src/hook/useRandomIncrement.js
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * useRandomIncrement
 *
 * const {
 *   value,           // número crudo: 4600
 *   formattedValue,  // string formateado: "4,600"
 *   isRunning,
 *   start,
 *   stop,
 *   reset,
 * } = useRandomIncrement({
 *   initial: 4600,
 *   minStep: 100,
 *   maxStep: 512,
 *   minInterval: 2000,
 *   maxInterval: 5100,
 *   autoStart: true,
 *
 *   // Opciones de formato:
 *   locale: "en-US",          // 1,000 / 1,000.00 según decimales
 *   minimumFractionDigits: 0, // sin decimales
 *   maximumFractionDigits: 0,
 * });
 */

function clampRange(a, b) {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return [min, max];
}

function randomInt(min, max) {
  const [lo, hi] = clampRange(min, max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

export default function useRandomIncrement({
  initial = 0,
  minStep = 1,
  maxStep = 10,
  minInterval = 100,
  maxInterval = 1000,
  autoStart = false,

  // FORMATO
  locale = "en-US",
  minimumFractionDigits = 0, // 🔹 por defecto SIN decimales
  maximumFractionDigits = 2,
} = {}) {
  const [value, setValue] = useState(initial);
  const [isRunning, setIsRunning] = useState(autoStart);

  const timerRef = useRef(null);

  // 🔴 IMPORTANTE: iniciar SIEMPRE en false
  // y dejar que start() lo ponga en true.
  const runningRef = useRef(false);

  const valueRef = useRef(initial);
  valueRef.current = value;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    if (!runningRef.current) return;

    const delay = randomInt(minInterval, maxInterval);

    timerRef.current = setTimeout(() => {
      setValue((prev) => {
        const step = randomInt(minStep, maxStep);
        return prev + step;
      });

      if (runningRef.current) {
        scheduleNext();
      }
    }, delay);
  }, [minInterval, maxInterval, minStep, maxStep]);

  const start = useCallback(() => {
    if (runningRef.current) return; // ya está corriendo
    runningRef.current = true;
    setIsRunning(true);
    clearTimer();
    scheduleNext();
  }, [scheduleNext, clearTimer]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(
    (newInitial) => {
      const startValue =
        typeof newInitial === "number" ? newInitial : initial;
      valueRef.current = startValue;
      setValue(startValue);
    },
    [initial]
  );

  useEffect(() => {
    if (autoStart) {
      start();
    }
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === FORMATO CON COMAS ===
  const formattedValue = useMemo(() => {
    try {
      // Aseguramos que sea número
      const numericValue =
        typeof value === "number" ? value : Number(value) || 0;

      const formatter = new Intl.NumberFormat(locale, {
        useGrouping: true,
        minimumFractionDigits,
        maximumFractionDigits,
      });

      return formatter.format(numericValue);
    } catch (e) {
      return String(value);
    }
  }, [value, locale, minimumFractionDigits, maximumFractionDigits]);

  return {
    value,          // número crudo
    formattedValue, // "4,600"
    isRunning,
    start,
    stop,
    reset,
  };
}
