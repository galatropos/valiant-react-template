import { useState, useEffect, useRef } from "react";

/**
 * Hook que cuenta del min al max con interval y timeOut opcional.
 * Se puede reiniciar usando restartTrigger.
 */
export function useCyclicCounter({
  min,
  max,
  interval = 500,
  timeOut = 2000,
  loop = false,
  restartTrigger = 0, // cada cambio reinicia el conteo
}) {
  const [count, setCount] = useState(min);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const startCounting = () => {
      setCount(min);

      intervalRef.current = setInterval(() => {
        setCount(prev => (prev >= max ? min : prev + 1));
      }, interval);

      if (!loop) {
        timeoutRef.current = setTimeout(() => {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }, timeOut);
      }
    };

    // Limpiamos cualquier intervalo anterior
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);

    startCounting();

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [min, max, interval, timeOut, loop, restartTrigger]); // reinicia al cambiar restartTrigger

  return count;
}
