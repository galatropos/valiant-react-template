import { useEffect, useRef, useState } from "react";

export function useProgress({ initial, finish, time, action, onUpdate }) {
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(initial);
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState("stop");

  const startTimeRef = useRef(null);
  const pauseTimeRef = useRef(0);
  const requestRef = useRef(null);

  // Progreso (0 → 1)
  const calculateProgress = (elapsed) => {
    return Math.min(elapsed / time, 1);
  };

  // Valor interpolado
  const calculateValue = (progress) => {
    return initial + (finish - initial) * progress;
  };

  const step = (timestamp) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp - pauseTimeRef.current;
    }

    const currentElapsed = timestamp - startTimeRef.current;
    const ratio = calculateProgress(currentElapsed);

    if (currentElapsed >= time) {
      setElapsed(time);
      setProgress(1);
      setValue(finish);
      setStatus("finish"); // 🔹 ahora se marca como "finish"
      cancelAnimationFrame(requestRef.current);
      onUpdate?.({
        initial,
        finish,
        elapsed: time,
        progress: 1,
        value: finish,
        status: "finish",
      });
      return;
    }

    setElapsed(currentElapsed);
    setProgress(ratio);
    const currentValue = calculateValue(ratio);
    setValue(currentValue);

    onUpdate?.({
      initial,
      finish,
      elapsed: currentElapsed,
      progress: ratio,
      value: currentValue,
      status: "play",
    });

    requestRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (action === "play") {
      setStatus("play");
      requestRef.current = requestAnimationFrame(step);
    } else if (action === "pause") {
      setStatus("pause");
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      pauseTimeRef.current = elapsed;
      startTimeRef.current = null;
    } else if (action === "stop") {
      setStatus("stop");
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      startTimeRef.current = null;
      pauseTimeRef.current = 0;
      setElapsed(0);
      setProgress(0);
      setValue(initial);
      onUpdate?.({
        initial,
        finish,
        elapsed: 0,
        progress: 0,
        value: initial,
        status: "stop",
      });
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [action]);

  return { elapsed, progress, value, status };
}
