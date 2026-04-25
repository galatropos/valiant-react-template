// src/component/HoldCircle.jsx
import React, { useRef, useState, useEffect } from "react";

/**
 * HoldCircle interactivo con "drag"
 *
 * - El relleno empieza ARRIBA (12 en punto).
 * - Mantén presionado (mouse o touch) y mueve alrededor del círculo.
 * - El ángulo desde las 12 (sentido horario) se convierte en porcentaje 0–100.
 *
 * Props:
 *   size         → tamaño del círculo en px (ancho y alto)
 *   value        → (opcional) modo controlado, valor 0–100 desde el padre
 *   onChange     → (opcional) callback cuando cambia el porcentaje
 *                    onChange(percent, { percent, value })
 *   completeAt   → (opcional) umbral de completo (default 100, en porcentaje)
 *   onComplete   → (opcional) callback (isComplete:boolean) cuando cambia
 *                  el estado de completo (true/false)
 *   onPressLeave → (opcional) callback cuando SUELTAS (mouse/touch)
 *                    onPressLeave({ percent, value })
 *   minValue     → (opcional) valor mínimo del rango mapeado (default 0)
 *   maxValue     → (opcional) valor máximo del rango mapeado (default 100)
 *
 *   Donde:
 *     percent = 0–100 (círculo)
 *     value   = minValue + (percent/100) * (maxValue - minValue)
 */
const HoldCircle = ({
  size = 80,
  value,
  onChange,
  completeAt = 100,
  onComplete,
  onPressLeave,
  minValue = 0,
  maxValue = 100,
}) => {
  const wrapperRef = useRef(null);

  // helper: redondear a 2 decimales máximo
  const round2 = (n) => Math.round(n * 100) / 100;

  // ¿Está controlado desde fuera?
  const isControlled = typeof value === "number";

  // Estado interno si NO es controlado
  const [internalValue, setInternalValue] = useState(
    typeof value === "number" ? value : 0
  );

  // Cuando el padre cambie "value", sincronizamos el interno
  useEffect(() => {
    if (isControlled) {
      setInternalValue(value);
    }
  }, [isControlled, value]);

  // Valor actual efectivo (porcentaje 0–100)
  const currentValue = isControlled ? value : internalValue;

  // Para saber si estamos en drag (mouse/touch presionado)
  const [isDragging, setIsDragging] = useState(false);

  // Ref para recordar si antes estaba "completo" o no
  const completeRef = useRef(false);

  // Helper: a partir de un porcentaje devuelve el valor mapeado al rango
  const mapPercentToValue = (percent) => {
    const p = Math.min(100, Math.max(0, percent));
    return minValue + (p / 100) * (maxValue - minValue);
  };

  // Normaliza y dispara cambios
  const updateValue = (newVal) => {
    const clamped = Math.min(100, Math.max(0, newVal));

    if (!isControlled) {
      setInternalValue(clamped);
    }

    if (onChange) {
      const mapped = mapPercentToValue(clamped);
      onChange(clamped, { percent: clamped, value: mapped });
    }
  };

  // Calcula porcentaje a partir de la posición del cursor/touch
  const updateFromClientPoint = (clientX, clientY) => {
    const el = wrapperRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2; // centro X
    const cy = rect.top + rect.height / 2; // centro Y

    const dx = clientX - cx;
    const dy = clientY - cy;

    // Ángulo estándar (0° a la derecha, crece horario por el eje Y hacia abajo)
    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI; // -180 a 180
    if (angleDeg < 0) angleDeg += 360; // 0 a 360

    // Queremos 0° ARRIBA (12 en punto):
    // angleDeg:   270 → arriba
    // angleFromTop: (270 + 90) % 360 = 0 → OK
    const angleFromTop = (angleDeg + 90) % 360;

    const newValue = Math.round((angleFromTop / 360) * 100);
    updateValue(newValue);
  };

  // --- Handlers de mouse ---
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    updateFromClientPoint(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    updateFromClientPoint(e.clientX, e.clientY);
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    // Si sueltas DENTRO del círculo, actualizamos al último punto
    updateFromClientPoint(e.clientX, e.clientY);
    // El cierre y onPressLeave los maneja el listener global (window mouseup)
  };

  const handleMouseLeave = () => {
    // No cancelamos el drag aquí;
    // así puedes salir, regresar y soltar.
  };

  // --- Handlers de touch (móvil) ---
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    e.preventDefault(); // evita scroll mientras arrastras
    setIsDragging(true);
    updateFromClientPoint(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    e.preventDefault(); // evita scroll
    updateFromClientPoint(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    // El cierre y onPressLeave los maneja el listener global (window touchend)
  };

  // 🔔 Listeners globales para soltar FUERA del círculo (mouse y touch)
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseUp = () => {
      setIsDragging(false);
      if (onPressLeave) {
        const percentNow = Math.min(
          100,
          Math.max(0, (isControlled ? value : internalValue) ?? 0)
        );
        const mapped = mapPercentToValue(percentNow);
        onPressLeave({
          percent: round2(percentNow),
          value: round2(mapped),
        });
      }
    };

    const handleWindowTouchEnd = () => {
      setIsDragging(false);
      if (onPressLeave) {
        const percentNow = Math.min(
          100,
          Math.max(0, (isControlled ? value : internalValue) ?? 0)
        );
        const mapped = mapPercentToValue(percentNow);
        onPressLeave({
          percent: round2(percentNow),
          value: round2(mapped),
        });
      }
    };

    window.addEventListener("mouseup", handleWindowMouseUp);
    window.addEventListener("touchend", handleWindowTouchEnd);

    return () => {
      window.removeEventListener("mouseup", handleWindowMouseUp);
      window.removeEventListener("touchend", handleWindowTouchEnd);
    };
  }, [
    isDragging,
    onPressLeave,
    isControlled,
    value,
    internalValue,
    minValue,
    maxValue,
  ]);

  // Aseguramos 0–100 para pintar
  const clamped = Math.min(100, Math.max(0, currentValue ?? 0));
  const progress = clamped / 100; // 0–1
  const degrees = progress * 360; // 0–360

  // 🔔 Detectar cambio de "completo" (true/false) según porcentaje
  useEffect(() => {
    const isNowComplete = clamped >= completeAt;
    if (isNowComplete !== completeRef.current) {
      completeRef.current = isNowComplete;
      if (onComplete) {
        onComplete(isNowComplete); // true o false
      }
    }
  }, [clamped, completeAt, onComplete]);

  const wrapperStyle = {
    width: size,
    height: size,
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    cursor: "pointer",
    touchAction: "none", // evita gestos por defecto en algunos navegadores
  };

  /**
   * En conic-gradient:
   * - 0deg está ARRIBA (12 en punto).
   * - El ángulo crece en sentido horario.
   */
  const circleStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: `conic-gradient(
      #3300CF 0deg,
      #3300CF ${degrees}deg,
      rgba(255, 255, 255, 0.1) ${degrees}deg,
      rgba(255, 255, 255, 0.1) 360deg
    )`,
    border: "2px solid rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  };

  const innerStyle = {
    width: "70%",
    height: "70%",
    borderRadius: "50%",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.22,
    color: "white",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    userSelect: "none",
  };

  return (
    <div
      ref={wrapperRef}
      style={wrapperStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div style={circleStyle}>
        <div style={innerStyle}>{clamped}%</div>
      </div>
    </div>
  );
};

export default HoldCircle;
