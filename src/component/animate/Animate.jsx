import { useEffect, useRef, useState } from "react";

function calculateMoveIncrement({ start, end, progress }) {
  return start + (end - start) * progress;
}

function calculateRotateIncrement({ start, end, progress }) {
  return start + (end - start) * progress;
}

function calculateOpacity({ start, end, progress }) {
  return start + (end - start) * progress;
}

function calculateScale({ start, end, progress }) {
  return start + (end - start) * progress;
}

export default function Animation({
  children,
  animate,
  sequence,
  status,
  onUpdate,
  loop = false,
  repeat = 1, // Añadido prop 'repeat' con valor por defecto 1
}) {
  const steps = sequence || [animate];
  const [currentStep, setCurrentStep] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0); // Para contar las repeticiones

  const [currentValues, setCurrentValues] = useState({
    opacity: 1,
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });

  const rafRef = useRef(null);
  const elapsedTime = useRef(0);
  const lastTimestamp = useRef(null);
  const stepStartRef = useRef({ ...currentValues });

  const stopAnimationFrame = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const runStep = (timestamp) => {
    const {
      opacity = 1,
      moveX = 0,
      moveY = 0,
      rotateX = 0,
      rotateY = 0,
      scale = 1,
      time = 1000,
    } = steps[currentStep];

    if (!lastTimestamp.current) lastTimestamp.current = timestamp;
    const delta = timestamp - lastTimestamp.current;
    lastTimestamp.current = timestamp;

    elapsedTime.current += delta;
    const progress = Math.min(elapsedTime.current / time, 1);

    const newValues = {
      x: calculateMoveIncrement({ start: stepStartRef.current.x, end: stepStartRef.current.x + moveX, progress }),
      y: calculateMoveIncrement({ start: stepStartRef.current.y, end: stepStartRef.current.y + moveY, progress }),
      rotateX: calculateRotateIncrement({ start: stepStartRef.current.rotateX, end: stepStartRef.current.rotateX + rotateX, progress }),
      rotateY: calculateRotateIncrement({ start: stepStartRef.current.rotateY, end: stepStartRef.current.rotateY + rotateY, progress }),
      scale: calculateScale({ start: stepStartRef.current.scale, end: scale, progress }),
      opacity: calculateOpacity({ start: stepStartRef.current.opacity, end: opacity, progress }),
    };

    setCurrentValues(newValues);
    if (onUpdate) onUpdate(newValues);

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(runStep);
    } else {
      stopAnimationFrame();
      stepStartRef.current = { ...newValues };
      elapsedTime.current = 0;
      lastTimestamp.current = null;

      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else if (loop) {
        setCurrentStep(0);
      } else if (repeatCount < repeat - 1) {
        // Verifica si necesita repetir más veces
        setRepeatCount((prev) => prev + 1);
        setCurrentStep(0);
      } else {
        console.log("✅ Secuencia completa");
      }
    }
  };

  useEffect(() => {
    if (status === "play") {
      lastTimestamp.current = null;
      rafRef.current = requestAnimationFrame(runStep);
    } else if (status === "pause") {
      stopAnimationFrame();
    } else if (status === "stop") {
      stopAnimationFrame();
      setCurrentStep(0);
      setRepeatCount(0); // Reinicia el contador de repeticiones
      elapsedTime.current = 0;
      stepStartRef.current = { x: 0, y: 0, rotateX: 0, rotateY: 0, scale: 1, opacity: 1 };
      setCurrentValues({ ...stepStartRef.current });
      if (onUpdate) onUpdate(stepStartRef.current);
    }

    return () => stopAnimationFrame();
  }, [status, currentStep]);

  const style = {
    transform: `
      translate(${currentValues.x}px, ${currentValues.y}px)
      rotateX(${currentValues.rotateX}deg)
      rotateY(${currentValues.rotateY}deg)
      scale(${currentValues.scale})
    `,
    opacity: currentValues.opacity,
  };

  return <span style={style}>{children}</span>;
}