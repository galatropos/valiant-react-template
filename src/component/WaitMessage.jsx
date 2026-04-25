import React, { useEffect, useRef, useState } from "react";

export default function WaitMessage({
  finish = 2000,       // ms totales antes de mostrar children
  base = "writing",    // texto base antes de los puntos
  interval = 300,      // ms entre pasos de puntos
  maxDots = 4,         // cantidad de puntos: 1..maxDots
  children,
  className,
  style,
  onDone,              // callback cuando termina
  controller,          // "play" | "pause" | "stop" | undefined (auto)
}) {
  const [done, setDone] = useState(false);
  const [dots, setDots] = useState(1);

  const intervalRef = useRef(null);
  const timeoutRef  = useRef(null);

  const startedAtRef   = useRef(null);      // timestamp cuando arrancó
  const remainingRef   = useRef(finish);    // ms restantes para terminar
  const onDoneFiredRef = useRef(false);     // evita doble onDone

  const clearTimers = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (timeoutRef.current)  { clearTimeout(timeoutRef.current);   timeoutRef.current  = null; }
  };

  const fireDoneOnce = () => {
    if (!onDoneFiredRef.current) {
      onDoneFiredRef.current = true;
      onDone?.();
    }
  };

  const startRunning = (msToFinish) => {
    clearTimers();
    setDone(false);
    startedAtRef.current = Date.now();
    remainingRef.current = msToFinish;

    intervalRef.current = setInterval(() => {
      setDots((d) => (d % maxDots) + 1);
    }, interval);

    timeoutRef.current = setTimeout(() => {
      setDone(true);
      clearTimers();
      fireDoneOnce();
    }, msToFinish);
  };

  const pauseRunning = () => {
    if (!startedAtRef.current) return; // no estaba corriendo
    const elapsed = Date.now() - startedAtRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    clearTimers();
    startedAtRef.current = null;
  };

  const stopNow = () => {
    // Terminado: muestra children y dispara onDone
    clearTimers();
    setDone(true);
    startedAtRef.current = null;
    remainingRef.current = 0;
    fireDoneOnce();
  };

  // --- MODO CONTROLADO: solo reacciona cuando CAMBIA 'controller' ---
  useEffect(() => {
    if (controller === undefined) return;

    switch (controller) {
      case "play": {
        if (done) {
          // venimos de stop/terminado → reiniciar desde 0
          onDoneFiredRef.current = false;
          setDots(1);
          remainingRef.current = finish;
          startRunning(finish);
        } else if (!startedAtRef.current) {
          // iniciar/reanudar con el tiempo restante
          const ms = Math.max(0, remainingRef.current ?? finish);
          startRunning(ms || finish);
        }
        break;
      }
      case "pause":
        pauseRunning();
        break;
      case "stop":
        stopNow();
        break;
      default:
        break;
    }
    // Intencional: SIN dependencias adicionales para evitar bucles.
  }, [controller]); // 👈 clave: solo cambia cuando tú cambias el controller

  // --- MODO AUTOMÁTICO (sin controller): se comporta como el original ---
  useEffect(() => {
    if (controller !== undefined) return; // si hay controller, no autoplay

    // reinicia ciclo al cambiar valores clave
    onDoneFiredRef.current = false;
    setDots(1);
    remainingRef.current = finish;
    startRunning(finish);

    return () => clearTimers();
  }, [controller, finish, base, interval, maxDots, onDone]);

  if (!done) {
    return (
      <span className={className} style={{ fontFamily: "monospace", ...style }}>
        {base}
        {".".repeat(dots)}
      </span>
    );
  }
  return <>{children}</>;
}
