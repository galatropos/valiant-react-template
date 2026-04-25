import React, { useEffect, useRef, useState } from "react";
import Card from "../../Card";
import { getRandomArrayIndex } from "../../../utils/random";

const defaultPortait = {
  width: 70, height: 40, x: 50, y: 50, anchor: "middle",
  fontSize: 10, rotate: 0, opacity: 1, scale: 1,
};
const defaultLandscape = {
  width: 40, height: 40, x: 0, y: 0, anchor: "left-top",
  fontSize: 10, rotate: 0, opacity: 1, scale: 1,
};

/**
 * controls: "continue" | "pause"
 * setControls: React.Dispatch<React.SetStateAction<"continue" | "pause">>
 */
const PopSlotMachine = ({
  elements = [],
  portrait = defaultPortait,
  landscape = defaultLandscape,
  style,
  interval = 200,
  timeOutContinue = 5000,
  timeOutPause = 4000,
  controls = "continue",
  setControls,
}) => {
  const [index, setIndex] = useState(0);
  const len = elements.length;

  // --- NUEVO: modo controlado vs no controlado ---
  const isControlled = typeof setControls === "function";
  const [innerControls, setInnerControls] = useState(controls);
  // valor efectivo de controls
  const controlsValue = isControlled ? controls : innerControls;
  const setControlsValue = isControlled ? setControls : setInnerControls;

  const intervalRef = useRef(null);
  const continueTimerRef = useRef(null);
  const pauseTimerRef = useRef(null);

  // Intervalo que solo avanza en "continue"
  useEffect(() => {
    if (!len) return; // sin elementos, no hagas nada
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (controlsValue === "continue") {
        setIndex((i) => (i + 1) % len);
      }
    }, Math.max(1, interval));

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [interval, len, controlsValue]);

  // Orquestación automática
  useEffect(() => {
    if (continueTimerRef.current) { clearTimeout(continueTimerRef.current); continueTimerRef.current = null; }
    if (pauseTimerRef.current)    { clearTimeout(pauseTimerRef.current);    pauseTimerRef.current = null; }

    if (!len) return;

    if (controlsValue === "continue") {
      continueTimerRef.current = setTimeout(() => {
        setIndex(getRandomArrayIndex(elements)); // fija aleatorio al pausar
        setControlsValue("pause");
      }, Math.max(0, timeOutContinue));
    } else { // "pause"
      pauseTimerRef.current = setTimeout(() => {
        setControlsValue("continue");
      }, Math.max(0, timeOutPause));
    }

    return () => {
      if (continueTimerRef.current) { clearTimeout(continueTimerRef.current); continueTimerRef.current = null; }
      if (pauseTimerRef.current)    { clearTimeout(pauseTimerRef.current);    pauseTimerRef.current = null; }
    };
  }, [controlsValue, timeOutContinue, timeOutPause, setControlsValue, elements, len]);

  // Evitar desbordes si cambia la lista
  useEffect(() => {
    if (index >= len && len > 0) setIndex(0);
  }, [len, index]);

  return (
    <Card portrait={portrait} landscape={landscape} style={style}>
      {len ? elements[index] : null}
    </Card>
  );
};


export default PopSlotMachine;