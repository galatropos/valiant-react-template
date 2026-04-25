// src/hook/useProgresses.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "./useProgress";

const lerp = (t, a, b) => a + (b - a) * t;

// 🔒 Memo por contenido: mantiene la misma referencia si el contenido no cambia
function useDeepStable(value) {
  const ref = useRef({ json: "", stable: value });
  const json = useMemo(() => {
    try { return JSON.stringify(value); } catch { return "" + Math.random(); }
  }, [value]);
  if (ref.current.json !== json) {
    ref.current = { json, stable: value };
  }
  return ref.current.stable;
}

function buildRanges({ default: def, animate }) {
  const keys = new Set(Object.keys(def || {}));
  for (const [delta] of animate) {
    if (delta) Object.keys(delta).forEach((k) => keys.add(k));
  }

  const acc = {};
  keys.forEach((k) => (acc[k] = typeof def?.[k] === "number" ? def[k] : 0));

  const ranges = [];
  for (const [delta] of animate) {
    const prev = {};
    keys.forEach((k) => (prev[k] = acc[k]));

    keys.forEach((k) => {
      const step = (delta && typeof delta[k] === "number") ? delta[k] : 0;
      acc[k] = acc[k] + step;
    });

    const entry = {};
    keys.forEach((k) => (entry[k] = [prev[k], acc[k]]));
    ranges.push(entry);
  }
  return ranges;
}

export function useProgresses({
  default: defaultValue = {},
  animate = [],
  action = "stop",
  onStepUpdate,
  onSequenceFinish,
  loop = false,
  repeat = null,
  onStepChange,
}) {
  // 🧊 Estabiliza entradas por contenido
  const stableDefault = useDeepStable(defaultValue);
  const stableAnimate = useDeepStable(animate);

  // Solo valores numéricos para interpolación
  const defaultValueFinish = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(stableDefault).filter(([, v]) => typeof v === "number")
      ),
    [stableDefault]
  );

  const ranges = useMemo(
    () => buildRanges({ default: defaultValueFinish, animate: stableAnimate }),
    [defaultValueFinish, stableAnimate]
  );
  const times = useMemo(
    () => stableAnimate.map((a) => (a?.[1] ?? 0)),
    [stableAnimate]
  );

  const [section, setSection] = useState(0);
  const [internal, setInternal] = useState("stop");
  const [sequenceValue, setSequenceValue] = useState(defaultValueFinish);
  const [cycleCount, setCycleCount] = useState(0);

  // Guarda el action previo para detectar transición real a "stop"
  const prevActionRef = useRef(action);

  // Acciones efectivas
  const effectiveAction = action === "pause" ? "pause" : internal;

  // Notificar cambio de paso
  const prevSectionRef = useRef(section);
  useEffect(() => {
    if (prevSectionRef.current !== section) {
      prevSectionRef.current = section;
      onStepChange?.(section);
    }
  }, [section, onStepChange]);

  // Responder a cambios de action (solo si cambia realmente)
  useEffect(() => {
    const prev = prevActionRef.current;
    prevActionRef.current = action;

    if (action === "stop" && prev !== "stop") {
      setInternal("stop");
      setSection(0);
      setSequenceValue(defaultValueFinish);
      setCycleCount(0);
      onStepChange?.(0);
      return;
    }
    if (action === "play" && prev !== "play") {
      setInternal((prevInt) => (prevInt === "finish" ? "finish" : "play"));
    }
    // si action === "pause" lo maneja effectiveAction arriba
  }, [action, defaultValueFinish, onStepChange]);

  // Mantener play activo al cambiar de sección si seguimos en "play"
  useEffect(() => {
    if (action === "play" && internal !== "finish") {
      setInternal("play");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  // 🚀 Saltar en caliente pasos con tiempo <= 0 para evitar cuelgues
  useEffect(() => {
    if (!stableAnimate.length) return;
    let idx = section;
    let jumped = false;

    // salta todos los pasos con time<=0 seguidos
    while (idx < times.length && (times[idx] ?? 0) <= 0) {
      // Aplica deltas instantáneos
      const r = ranges[idx] || {};
      const current = {};
      for (const key in r) {
        const [i, f] = r[key];
        current[key] = f; // al final del salto instantáneo
      }
      const stepDelta = stableAnimate[idx]?.[0] || null;
      if (stepDelta) {
        for (const k of Object.keys(stepDelta)) {
          const v = stepDelta[k];
          if (typeof v !== "number") current[k] = v;
        }
      }
      setSequenceValue(current);
      idx += 1;
      jumped = true;
    }

    if (jumped) {
      if (idx >= stableAnimate.length) {
        // Fin de secuencia tras saltos
        setCycleCount((c) => {
          const newCount = c + 1;

          if (repeat !== null && newCount >= repeat) {
            setInternal("finish");
            onSequenceFinish?.();
            return newCount;
          }
          if (loop && action === "play") {
            setInternal("stop");
            setSection(0);
            return newCount;
          }
          if (repeat !== null && newCount < repeat) {
            setInternal("stop");
            setSection(0);
            return newCount;
          }
          setInternal("finish");
          onSequenceFinish?.();
          return newCount;
        });
      } else {
        // Continúa en el primer paso con tiempo > 0
        setInternal("stop");
        setSection(idx);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, times, ranges, stableAnimate, loop, repeat, action, onSequenceFinish]);

  // Motor de avance por paso
  useProgress({
    initial: 0,
    finish: 1,
    time: times[section] ?? 0,
    action: effectiveAction,
    onUpdate: (s) => {
      const r = ranges[section] || {};
      const current = {};
      for (const key in r) {
        const [i, f] = r[key];
        current[key] = lerp(s.progress, i, f);
      }

      // Copiar claves NO numéricas (anchor, etc.)
      const stepDelta = stableAnimate[section]?.[0] || null;
      if (stepDelta) {
        for (const k of Object.keys(stepDelta)) {
          const v = stepDelta[k];
          if (typeof v !== "number") current[k] = v;
        }
      }

      setSequenceValue(current);
      onStepUpdate?.({ ...s, section, value: current });

      if (action === "pause") return;

      if (s.status === "finish") {
        const last = section >= stableAnimate.length - 1;

        if (last) {
          // ciclo completo
          setCycleCount((c) => {
            const newCount = c + 1;

            if (repeat !== null && newCount >= repeat) {
              setInternal("finish");
              onSequenceFinish?.();
              return newCount;
            }
            if (loop && action === "play") {
              setInternal("stop");
              setSection(0);
              return newCount;
            }
            if (repeat !== null && newCount < repeat) {
              setInternal("stop");
              setSection(0);
              return newCount;
            }
            setInternal("finish");
            onSequenceFinish?.();
            return newCount;
          });
          return;
        }

        // Avanzar a la siguiente sección
        setInternal("stop");
        setSection((idx) => idx + 1);
      }
    },
  });

  return {
    sequenceValue,
    section,
    stepIndex: section,
    stepCount: stableAnimate.length,
    status: effectiveAction,
    cycleCount,
  };
}
