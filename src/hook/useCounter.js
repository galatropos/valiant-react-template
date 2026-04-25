import { useEffect, useRef, useState } from "react";

/**
 * useCounter (sin controles externos)
 * Devuelve solo `cont` (número).
 *
 * Opciones:
 * - from: inicio (default 0)
 * - to: final (default 64)
 * - step: tamaño de paso (abs; dirección se infiere) (default 1)
 * - refreshMs: tiempo entre ticks (ms) (default 60)
 * - autostart: arranca solo (default true)
 * - repeatEveryMs: si se define, al llegar a `to` reinicia desde `from` tras este delay (default null)
 */
export function useCounter({
  from = 0,
  to = 64,
  step = 1,
  refreshMs = 60,
  autostart = true,
  repeatEveryMs = null,
} = {}) {
  const direction = to >= from ? 1 : -1;
  const signedStep = Math.max(1, Math.abs(step)) * direction;

  const [cont, setCont] = useState(from);

  const runningRef = useRef(autostart);
  const tickRef = useRef(null);
  const repeatRef = useRef(null);

  // Mantén runningRef sincronizado solo cuando cambie autostart
  useEffect(() => {
    runningRef.current = autostart;
  }, [autostart]);

  const clearTick = () => {
    if (tickRef.current) {
      clearTimeout(tickRef.current);
      tickRef.current = null;
    }
  };
  const clearRepeat = () => {
    if (repeatRef.current) {
      clearTimeout(repeatRef.current);
      repeatRef.current = null;
    }
  };

  useEffect(() => {
    const reachedEnd =
      (direction === 1 && cont >= to) || (direction === -1 && cont <= to);

    clearTick(); // defensivo: no acumular timeouts

    if (!runningRef.current) return;

    if (reachedEnd) {
      if (repeatEveryMs != null) {
        if (!repeatRef.current) {
          repeatRef.current = setTimeout(() => {
            repeatRef.current = null;
            setCont(from);
          }, Math.max(0, repeatEveryMs));
        }
      } else {
        runningRef.current = false; // detener definitivamente
      }
      return;
    }

    tickRef.current = setTimeout(() => {
      setCont((prev) => {
        const next = prev + signedStep;
        if (
          (direction === 1 && next >= to) ||
          (direction === -1 && next <= to)
        ) {
          return to;
        }
        return next;
      });
    }, Math.max(10, refreshMs));

    return () => {
      clearTick();
      // Ojo: NO limpiamos repeat aquí para permitir el “delay” de repeat.
      // Se limpiará solo al desmontar o si cambian parámetros relevantes abajo.
    };
  }, [cont, from, to, signedStep, refreshMs, repeatEveryMs, direction]);

  // Si cambian parámetros base, cancelamos el repeat pendiente
  useEffect(() => {
    clearRepeat();
    // reinicia el contador cuando cambian from/to
    setCont(from);
    runningRef.current = autostart;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  // Limpieza en unmount
  useEffect(() => {
    return () => {
      clearTick();
      clearRepeat();
    };
  }, []);

  return cont;
}
