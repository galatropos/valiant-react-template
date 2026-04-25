// src/component/effects/carousel/carRing3D.jsx
// 3D ring-style image carousel (React + framer-motion)
//
// Versión acoplada al padre (Card) + reflejo "inside"
// - El componente ocupa width: 100% y height: 100% del contenedor padre.
// - El anillo 3D se escala junto con el tamaño del Card.
// - El reflejo se dibuja dentro de la misma tarjeta (no se sale por debajo),
//   para que no se corte en pantallas con poca altura (landscape pequeño).
// - Mantiene auto-rotación, click, onFrontIndexChange y showReflection.

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

function normalizeImages(images) {
  const safe = (images || []).filter(Boolean); // quita null/undefined/""

  const normalized = safe.map((item, index) => {
    if (typeof item === "string") {
      return { src: item, alt: `Image ${index + 1}` };
    }
    if (item && typeof item === "object") {
      // Formato tipo Framer: { image: { src, alt } }
      if (item.image && typeof item.image === "object") {
        return {
          src: item.image.src,
          alt: item.image.alt || `Image ${index + 1}`,
        };
      }
      // Formato directo: { src, alt }
      return {
        src: item.src,
        alt: item.alt || `Image ${index + 1}`,
      };
    }
    return null;
  });

  // Solo las que realmente tienen src
  return normalized.filter((it) => it && it.src);
}

export default function carouselRing3D({
  images,
  spacing = 300,      // radio del anillo
  imageWidth = 220,    // se dejan por compatibilidad, no mandan el layout
  imageHeight = 280,   // idem
  perspective = 1000,
  autoRotate = false,
  rotationSpeed = 20,  // segundos por vuelta completa
  showReflection = false,
  borderRadius = 12,
  background = "transparent",
  direction = 1,       // 1 o -1
  onFrontIndexChange,
}) {
  const validImages = normalizeImages(images);
  const imageCount = validImages.length || 1;
  const angleStep = 360 / imageCount;

  // Rotación global del anillo
  const rotation = useMotionValue(0);

  // Para no spamear el callback
  const [frontIndex, setFrontIndex] = useState(0);

  // Suscribir al MotionValue para saber qué índice va al frente
  useEffect(() => {
    if (!imageCount) return;

    const unsubscribe = rotation.on("change", (value) => {
      const rawIndex = -value / angleStep;
      let idx = Math.round(rawIndex);

      // Normalizar a [0, imageCount)
      idx = ((idx % imageCount) + imageCount) % imageCount;

      setFrontIndex((prev) => {
        if (prev !== idx) {
          if (typeof onFrontIndexChange === "function") {
            onFrontIndexChange(idx);
          }
          return idx;
        }
        return prev;
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [rotation, angleStep, imageCount, onFrontIndexChange]);

  // Auto-rotación continua
  useEffect(() => {
    if (!autoRotate) return;

    let frameId;
    let lastTime = performance.now();
    const dir = direction >= 0 ? 1 : -1;
    const degPerSecond = (360 / rotationSpeed) * dir;

    const loop = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const current = rotation.get();
      rotation.set(current + degPerSecond * dt);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [autoRotate, rotationSpeed, direction, rotation]);

  // Click: girar a la tarjeta clickeada
  const handleImageClick = (index) => {
    const current = rotation.get();

    const baseAngle = -angleStep * index;
    const baseMod = ((baseAngle % 360) + 360) % 360; // 0..359

    let target = baseMod;

    if (direction >= 0) {
      const turns = Math.floor(current / 360);
      target = baseMod + 360 * turns;
      if (target <= current) {
        target += 360;
      }
    } else {
      const turns = Math.floor(current / 360);
      target = baseMod + 360 * turns;
      if (target >= current) {
        target -= 360;
      }
    }

    animate(rotation, target, {
      type: "spring",
      stiffness: 80,
      damping: 30,
    });
  };

  // 🔴 IMPORTANTE:
  // Este componente asume que el PADRE (Card) le da un tamaño concreto.
  // Ejemplo:
  // <Card ... style={{ width: 300, height: 400 }}> <CarouselRing3D ... /> </Card>

  return (
    <div
      style={{
        width: "100%",          // se adapta al Card
        height: "100%",         // se adapta al Card
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "visible",
        position: "relative",
        userSelect: "none",
        background,
        transformStyle: "preserve-3d",
        perspective,
      }}
    >
      {/* Escenario 3D: ocupa TODO el espacio del Card */}
      <motion.div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Anillo que gira */}
        <motion.div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            rotateY: rotation,
          }}
        >
          {validImages.map((item, index) => {
            const angle = angleStep * index;
            const translateZ = spacing;

            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  width: "100%",      // la tarjeta llena el escenario
                  height: "100%",
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${translateZ}px)`,
                  transformStyle: "preserve-3d",
                  // backfaceVisibility: "hidden", // si quieres ocultar las de espaldas, descomenta
                  cursor: "pointer",
                }}
                onClick={() => handleImageClick(index)}
              >
                {/* Imagen principal */}
                <motion.img
                  src={item.src}
                  alt={item.alt}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius,
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
                    pointerEvents: "none",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  draggable={false}
                />

                {/* Reflejo DENTRO de la tarjeta (no se sale por debajo) */}
                {showReflection && item.src && (
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "40%",       // parte inferior
                      top: "60%",          // empieza un poco abajo de la mitad
                      left: 0,
                      transform: "scaleY(-1)",
                      transformOrigin: "top",
                      opacity: 0.35,
                      maskImage:
                        "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
                      pointerEvents: "none",
                    }}
                  >
                    <img
                      src={item.src}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius,
                      }}
                      draggable={false}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
