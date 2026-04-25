// src/components/FluidGradient.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

/**
 * FluidGradient
 *
 * Props:
 * - color1, color2, color3
 * - gradientSpeed
 * - blur
 * - fullScreen
 * - zIndex
 * - blobSize: número en porcentaje. Ej: 150, 120, 100, 70
 *
 * Posición manual del inicio de color de cada blob:
 * - blob1X, blob1Y
 * - blob2X, blob2Y
 * - blob3X, blob3Y
 *
 * Ejemplo:
 * <FluidGradient
 *   blob1X={80}
 *   blob1Y={50}
 *   blob2X={20}
 *   blob2Y={80}
 *   blob3X={50}
 *   blob3Y={20}
 * />
 */
export default function FluidGradient({
  color1 = "#FF9479",
  color2 = "#F57FB9",
  color3 = "#B781E3",
  gradientSpeed = 3,
  blur = 100,
  fullScreen = false,
  zIndex = 0,
  blobSize = 150,

  blob1X = 80,
  blob1Y = 50,

  blob2X = 20,
  blob2Y = 80,

  blob3X = 50,
  blob3Y = 20,
}) {
  const duration = 20 / gradientSpeed;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizePercent = `${blobSize}%`;

  const getBlobPosition = ({ anchorX, anchorY, gradientX, gradientY }) => {
    const left = anchorX - (blobSize * gradientX) / 100;
    const top = anchorY - (blobSize * gradientY) / 100;

    return {
      left: `${left}%`,
      top: `${top}%`,
    };
  };

  /**
   * Anchors base del layout original.
   * Si quieres luego también te puedo sacar estos a props:
   * - blob1AnchorX / blob1AnchorY
   * - blob2AnchorX / blob2AnchorY
   * - blob3AnchorX / blob3AnchorY
   */
  const blob1Pos = getBlobPosition({
    anchorX: 95,
    anchorY: 50,
    gradientX: blob1X,
    gradientY: blob1Y,
  });

  const blob2Pos = getBlobPosition({
    anchorX: 5,
    anchorY: 95,
    gradientX: blob2X,
    gradientY: blob2Y,
  });

  const blob3Pos = getBlobPosition({
    anchorX: 50,
    anchorY: 5,
    gradientX: blob3X,
    gradientY: blob3Y,
  });

  const GradientContent = () => (
    <>
      <motion.div
        style={{
          position: "absolute",
          width: sizePercent,
          height: sizePercent,
          left: blob1Pos.left,
          top: blob1Pos.top,
          background: `radial-gradient(circle at ${blob1X}% ${blob1Y}%, ${color1} 0%, transparent 50%)`,
          filter: `blur(${blur}px)`,
        }}
        animate={{
          x: ["0%", "20%", "0%"],
          y: ["0%", "25%", "0%"],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        style={{
          position: "absolute",
          width: sizePercent,
          height: sizePercent,
          left: blob2Pos.left,
          top: blob2Pos.top,
          background: `radial-gradient(circle at ${blob2X}% ${blob2Y}%, ${color2} 0%, transparent 50%)`,
          filter: `blur(${blur}px)`,
        }}
        animate={{
          x: ["0%", "-20%", "0%"],
          y: ["0%", "20%", "0%"],
        }}
        transition={{
          duration: duration * 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        style={{
          position: "absolute",
          width: sizePercent,
          height: sizePercent,
          left: blob3Pos.left,
          top: blob3Pos.top,
          background: `radial-gradient(circle at ${blob3X}% ${blob3Y}%, ${color3} 0%, transparent 50%)`,
          filter: `blur(${blur}px)`,
        }}
        animate={{
          x: ["0%", "15%", "0%"],
          y: ["0%", "-20%", "0%"],
        }}
        transition={{
          duration: duration * 0.9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );

  if (fullScreen) {
    if (!mounted || typeof document === "undefined") return null;

    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          pointerEvents: "none",
          zIndex,
        }}
      >
        <GradientContent />
      </div>,
      document.body
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        minWidth: "100px",
        minHeight: "100px",
        zIndex,
      }}
    >
      <GradientContent />
    </div>
  );
}