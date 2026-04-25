import React, { useEffect, useRef, useState } from "react";
import Card from "../../Card";

const defaultPortrait = {
  width: 50,
  height: 50,
  x: 50,
  y: 50,
  anchor: "middle",
};
const defaultLandscape = {
  width: 40,
  height: 40,
  x: 0,
  y: 0,
  anchor: "middle",
};


/**
 * PopTicker
 * - Cambia de imagen con intervalos variables usando SOLO setTimeout.
 * - Cada `change`-ésimo tick usa `timeoutChange` en lugar de `intervalChange`.
 *
 * Props:
 *  - elements: ReactNode[]        // las imágenes/nodos a rotar
 *  - intervalChange: number       // ms entre cambios normales (p.ej. 100)
 *  - timeoutChange: number        // ms de “pausa” cada N cambios (p.ej. 2000)
 *  - change: number               // cada cuántos cambios usar timeoutChange (p.ej. 4)
 *  - portrait, landscape, style   // mismos que tu Card
 *  - startIndex?: number          // opcional, índice de inicio
 */
export default function PopTicker({
  elements = [],
  intervalChange = 300,
  timeoutChange = 3000,
  change = 5,
  portrait = defaultPortrait,
  landscape = defaultLandscape,
  style = {},
  startIndex = 0,
}) {

  const len = elements.length;
  const [index, setIndex] = useState(startIndex % len);

  // Contador total de “ticks” (NO se reinicia cuando el índice da la vuelta)
  const stepCountRef = useRef(0);
  const timerRef = useRef(null);

  // Función que agenda el siguiente cambio con el delay correcto
  const scheduleNext = () => {
    const steps = stepCountRef.current;

    // ¿Toca “pausa” (timeoutChange) o cambio normal (intervalChange)?
    // Si queremos que la PAUSA ocurra CADA N CAMBIOS completos ANTES del siguiente,
    // usamos: (steps > 0 && steps % change === 0)
    const isPauseTurn = change > 0 && steps > 0 && steps % change === 0;
    const delay = isPauseTurn ? Math.max(0, timeoutChange) : Math.max(1, intervalChange);

    timerRef.current = setTimeout(() => {
      // Avanza índice y suma el paso
      setIndex((prev) => (prev + 1) % len);
      stepCountRef.current = steps + 1;

      // Agenda el siguiente
      scheduleNext();
    }, delay);
  };

  // Arranca/reinicia la máquina de tiempo cuando cambian parámetros clave
  useEffect(() => {
    // Limpieza previa si cambia config
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // No reiniciamos stepCountRef para respetar tu requerimiento:
    // “resetear el element (índice) pero NO el count del siguiente que se parará”.
    // Solo si quieres reiniciar el flujo completo al cambiar props, descomenta:
    // stepCountRef.current = 0;

    scheduleNext();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // Si quieres que cambiar elements/intervalChange/etc. re-programe tiempos, mantenlos aquí:
  }, [len, intervalChange, timeoutChange, change]);

  return (
    <Card portrait={portrait} landscape={landscape} style={style}>
      {elements[index]}
    </Card>
  );
}