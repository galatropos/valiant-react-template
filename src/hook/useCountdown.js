// useCountdown.js
import { useEffect, useState, useRef } from "react";

// Convierte "HH:MM:SS" → segundos
function parseTimeString(timeString) {
  if (!timeString) return 0;

  const parts = timeString.split(":").map((p) => parseInt(p, 10) || 0);
  const [h, m, s] = [
    parts[0] ?? 0,
    parts[1] ?? 0,
    parts[2] ?? 0,
  ];

  return h * 3600 + m * 60 + s;
}

// Convierte string u objeto → segundos totales
function parseInitialTime(initialTime) {
  // "12:00:00"
  if (typeof initialTime === "string") {
    return parseTimeString(initialTime);
  }

  // { hours, minutes, seconds }
  if (initialTime && typeof initialTime === "object") {
    const hours = "hours" in initialTime ? Number(initialTime.hours) || 0 : 0;
    const minutes =
      "minutes" in initialTime ? Number(initialTime.minutes) || 0 : 0;
    const seconds =
      "seconds" in initialTime ? Number(initialTime.seconds) || 0 : 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  return 0;
}

// Qué partes se deben mostrar en formatted / time
function getVisibleParts(initialTime) {
  if (initialTime && typeof initialTime === "object") {
    return {
      showHours: "hours" in initialTime,
      showMinutes: "minutes" in initialTime,
      showSeconds: "seconds" in initialTime,
    };
  }

  // Si viene string (ej. "12:00:00"), mostramos todo
  return {
    showHours: true,
    showMinutes: true,
    showSeconds: true,
  };
}

// Formatea con 2 dígitos
function pad2(num) {
  return num.toString().padStart(2, "0");
}

/**
 * Hook de cuenta regresiva
 *
 * @param {string | {hours?: number, minutes?: number, seconds?: number}} initialTime
 *   - "12:00:00"
 *   - { hours: 12, minutes: 0, seconds: 0 }
 *
 * @returns {
 *   hours, minutes, seconds, // números (siempre existen)
 *   formatted,               // string con solo las partes definidas
 *   isFinished,              // boolean
 *   reset,                   // función para reiniciar
 *   time                     // objeto { hours?, minutes?, seconds? } solo con partes visibles
 * }
 */
export default function useCountdown(initialTime = "00:00:00") {
  // Congelamos el valor inicial solo una vez
  const initialRef = useRef(parseInitialTime(initialTime));
  const visibleRef = useRef(getVisibleParts(initialTime));

  const [remaining, setRemaining] = useState(initialRef.current);

  // ⏱️ Intervalo que solo se crea UNA vez
  useEffect(() => {
    if (initialRef.current <= 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const { showHours, showMinutes, showSeconds } = visibleRef.current;

  // Construimos el string solo con partes definidas
  const parts = [];
  if (showHours) parts.push(pad2(hours));
  if (showMinutes) parts.push(pad2(minutes));
  if (showSeconds) parts.push(pad2(seconds));
  const formatted = parts.join(":");

  const isFinished = remaining <= 0;

  // Objeto solo con claves definidas
  const time = {};
  if (showHours) time.hours = hours;
  if (showMinutes) time.minutes = minutes;
  if (showSeconds) time.seconds = seconds;

  const reset = () => {
    setRemaining(initialRef.current);
  };

  return {
    hours,
    minutes,
    seconds,
    formatted,
    isFinished,
    reset,
    time,
  };
}
