import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "../../Card";
import useOrientation from "../../../hook/useOrientation"; // export default

// === Hook: 1 (inicio), 2 (faltando 1s), 3 (faltando 0.5s) en ciclos de `interval` ===
export function useThreeSteps(interval = 3000) {
  const [value, setValue] = useState(1);
  const timers = useRef([]);

  useEffect(() => {
    const clearAll = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    clearAll();

    const runCycle = () => {
      setValue(1); // t=0
      timers.current.push(setTimeout(() => setValue(2), interval - 1000)); // faltando 1s
      timers.current.push(setTimeout(() => setValue(3), interval - 500));  // faltando 0.5s
      timers.current.push(setTimeout(runCycle, interval));                 // reinicia
    };

    runCycle();
    return clearAll;
  }, [interval]);

  return value;
}

// =====================  COMPONENTE =====================
const StreamDefault = ({
  portrait,
  landscape,
  style,
  elements = [],
  intervalChange = 3000,
  // Nuevos props (reemplazan a "direction")
  directionPortrait = "top",     // "left" | "right" | "top" | "bottom"
  directionLandscape = "top",     // "left" | "right" | "top" | "bottom"
}) => {
  const [index, setIndex] = useState(0);
  const [control, setControl] = useState(false); // false=stop, true=play
  const step = useThreeSteps(intervalChange);

  // Orientación actual
  const orientation = useOrientation();
  const isPortrait = orientation === "portrait";

  // ===== Helpers de animación =====
  const makeHorizontalByWidth = (w, dir) => {
    const W = Math.abs(w);
    const isRight = dir === "right";
    return [
      [{ width: isRight ? -W : +W }, 400], // right: -W -> +W ; left: +W -> -W
      [{ width: isRight ? +W : -W }, 400],
      [{} , 400],
    ];
  };

  // ✅ Corregido para que "top" y "bottom" coincidan con tu significado original
  const makeVerticalByHeight = (h, dir) => {
    const H = Math.abs(h);
    const isTop = dir === "top";
    return [
      [{ height: isTop ? -H : +H }, 400],  // top: -H -> +H ; bottom: +H -> -H
      [{y:20 }, 0],  // top: -H -> +H ; bottom: +H -> -H
      [{ height: isTop ? +H : +H }, 400],
      [{} , 400],
    ];
  };

  // ===== Portrait activo: usa directionPortrait =====
  const portraitForCard = useMemo(() => {
    const p = { ...portrait };
    if (isPortrait) {
      if (directionPortrait === "left" || directionPortrait === "right") {
        const w = p?.width ?? 0;
        p.animate = makeHorizontalByWidth(w, directionPortrait);
      } else {
        const h = p?.height ?? 0;
        p.animate = makeVerticalByHeight(h, directionPortrait);
      }
    } else {
      delete p?.animate;
    }
    return p;
  }, [portrait, isPortrait, directionPortrait]);

  // ===== Landscape activo: usa directionLandscape =====
  const landscapeForCard = useMemo(() => {
    const l = { ...landscape };
    if (!isPortrait) {
      if (directionLandscape === "left" || directionLandscape === "right") {
        const w = l?.width ?? (portrait?.width ?? 0);
        l.animate = makeHorizontalByWidth(w, directionLandscape);
      } else {
        const h = l?.height ?? (portrait?.height ?? 0);
        l.animate = makeVerticalByHeight(h, directionLandscape);
      }
    } else {
      delete l?.animate;
    }
    return l;
  }, [landscape, portrait, isPortrait, directionLandscape]);

  // ===== Lógica de 3 pasos =====
  useEffect(() => {
    if (!elements.length) return;

    if (step === 1) {
      setControl(false); // stop
    } else if (step === 2) {
      requestAnimationFrame(() => setControl(true)); // play
    } else if (step === 3) {
      setIndex((c) => (c + 1) % elements.length); // cambia imagen
    }
  }, [step, elements.length]);

  const styleDefault = { overflow: "hidden", ...style };

  return (
    <Card
      style={styleDefault}
      portrait={portraitForCard}
      landscape={landscapeForCard}
      loop={true}
      controlsAnimate={control ? "play" : "stop"}
    >
      {elements[index]}
    </Card>
  );
};

export default StreamDefault;
