// FlipElement.jsx
// Componente React + Framer Motion para hacer flip 3D entre VARIOS elementos.
// Gira 180° y a "media vuelta" cambia al siguiente elemento del array `elements`.

import React, { useState, useEffect, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";

/**
 * FlipElement
 *
 * Props:
 * - elements: array de React nodes (jsx) que se mostrarán uno por uno.
 *   Ej: elements={[ <img ... />, <div>Hola</div>, <MiCard /> ]}
 * - flipAxis: "y" (horizontal tipo carta) o "x" (vertical)
 * - trigger: "click" | "hover"  (cómo se dispara el flip manual)
 * - duration: duración del giro 0° -> 180° en segundos
 * - perspective: profundidad 3D (en px)
 * - width, height: tamaño opcional del wrapper
 * - autoFlip: si true, girará solo cada X ms
 * - autoFlipIntervalMs: tiempo entre flips automáticos
 * - autoFlipStartDelayMs: delay antes de iniciar autoFlip
 * - hideBackface: si true, se oculta la cara de atrás (estilo carta)
 * - className, style: props para el contenedor externo
 */
export default function FlipElement({
  elements = [],
  flipAxis = "y",
  trigger = "click",
  duration = 0.6,
  perspective = 800,
  width="100%",
  height="100%",
  autoFlip = true,
  autoFlipIntervalMs = 1200,
  autoFlipStartDelayMs = 0,
  hideBackface = false,
  className = "",
  style = {},
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSwappedInThisFlip, setHasSwappedInThisFlip] = useState(false);
  const [angle, setAngle] = useState(0); // acumulado en grados (0, 180, 360, ...)

  const controls = useAnimation();

  const axisKey = flipAxis === "x" ? "rotateX" : "rotateY";

  const totalElements = Array.isArray(elements) ? elements.length : 0;

  // Disparar un flip (manual o automático)
  const queueFlip = useCallback(() => {
    if (totalElements <= 1) return; // nada que cambiar
    setHasSwappedInThisFlip(false); // para este giro todavía no hemos cambiado
    setAngle((prev) => prev + 180); // sumamos 180° (media vuelta)
  }, [totalElements]);

  // Animar cuando cambia `angle`
  useEffect(() => {
    controls.start({
      [axisKey]: angle,
      transition: { duration, ease: "easeInOut" },
    });
  }, [angle, axisKey, controls, duration]);

  // Auto flip con intervalo
  useEffect(() => {
    if (!autoFlip || totalElements <= 1) return;

    let intervalId;
    const timeoutId = setTimeout(() => {
      // primer flip
      queueFlip();
      // siguientes flips
      intervalId = setInterval(() => {
        queueFlip();
      }, autoFlipIntervalMs);
    }, autoFlipStartDelayMs);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    autoFlip,
    autoFlipIntervalMs,
    autoFlipStartDelayMs,
    queueFlip,
    totalElements,
  ]);

  // Handlers manuales
  const handleClick = () => {
    if (trigger === "click") {
      queueFlip();
    }
  };

  const handleHoverStart = () => {
    if (trigger === "hover") {
      queueFlip();
    }
  };

  const handleHoverEnd = () => {
    // en este diseño no hacemos nada al salir del hover
  };

  // En cada animación, detectar "media vuelta" y cambiar de elemento
  const handleUpdate = (latest) => {
    const rawValue = latest[axisKey] ?? 0;
    // Normalizamos al rango [0, 180) dentro del flip actual
    const normalized = ((rawValue % 180) + 180) % 180; // asegura valor positivo
    // Cuando pasa de 90° (media vuelta), cambiamos al siguiente elemento
    if (!hasSwappedInThisFlip && normalized >= 90) {
      setCurrentIndex((prev) => {
        if (totalElements === 0) return 0;
        return (prev + 1) % totalElements;
      });
      setHasSwappedInThisFlip(true);
    }
  };

  const currentElement =
    totalElements > 0 ? elements[currentIndex] : null;

  return (
    <div
      className={className}
      style={{
        display: "inline-block",
        perspective: `${perspective}px`,
        width,
        height,
        ...style,
      }}
    >
      <motion.div
        onClick={handleClick}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        animate={controls}
        initial={{ [axisKey]: 0 }}
        onUpdate={handleUpdate}
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          backfaceVisibility: hideBackface ? "hidden" : "visible",
        }}
      >
        {currentElement}
      </motion.div>
    </div>
  );
}
