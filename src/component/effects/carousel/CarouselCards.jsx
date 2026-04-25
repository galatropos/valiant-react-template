import React, { useState, useRef, useEffect } from "react";

// Carrusel tipo stack que ocupa el tamaño del padre.
//
// Props principales:
// - elements: ReactNode[] (obligatorio)
// - auto: boolean -> autoplay on/off
// - autoDelay: ms entre cambios automáticos
// - centerScale: escala base cuando el ítem está en el centro
// - gapCenter: distancia entre centro y vecinos inmediatos
// - gapSide: distancia adicional entre vecinos inmediatos y los segundos vecinos
// - orientation: "vertical" | "horizontal"
// - blur: número base de blur (px).
//      * center siempre = 0
//      * capa 1 usa blur
//      * capa 2 usa blur * 2
//      * resto blur * 3
// - cardWidth: ancho de la card (string o número). Ej: "80%" o 320
// - cardHeight: alto de la card (string o número). Ej: "60%" o 200
// - cardMaxWidth: máximo ancho (opcional, string o número)
// - cardMaxHeight: máximo alto (opcional, string o número)
// - animationScale: factor extra de escala cuando entra al centro.
//      * 0 o 1 => sin animación extra
//      * >1   => hace un "bump": sube a centerScale * animationScale,
//                se queda unos ms y regresa a centerScale.
// - animationDelay: ms que espera ANTES de empezar el bump.
// - animationHold: ms que se queda en grande para apreciar la imagen.

const styles = `
.carouselCards-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 260px; /* por si el padre no tiene height definido */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.carouselCards-track {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* La card ya NO define width/height fijos:
   esos vienen por props (cardWidth, cardHeight, etc.) */
.carouselCards-card {
  position: absolute;
  background: white;
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    filter 0.4s ease-out;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Solo las imágenes llenan la tarjeta */
.carouselCards-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Clases sólo manejan z-index y opacity.
   La posición (translateX/Y / scale / translateZ) se calcula en React via inline style. */
.carouselCards-card.isCenter {
  z-index: 10;
}

.carouselCards-card.isUp1,
.carouselCards-card.isDown1 {
  z-index: 5;
  opacity: 0.9;
}

.carouselCards-card.isUp2,
.carouselCards-card.isDown2 {
  z-index: 1;
  opacity: 0.7;
}

.carouselCards-card.isHidden {
  opacity: 0;
  pointer-events: none;
}
`;

// Normaliza tamaños: si es número -> "Npx", si es string -> se usa tal cual.
const normalizeSize = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === "number") return `${value}px`;
  return value;
};

const CarouselCards = ({
  elements,
  auto = false,
  autoDelay = 3000,
  centerScale = 1.08,
  gapCenter = 150,
  gapSide = 120,
  orientation = "vertical",
  blur = 0,
  cardWidth,
  cardHeight,
  cardMaxWidth,
  cardMaxHeight,
  animationScale = 0,
  // 👇 NUEVOS PROPS
  animationDelay = 0,   // ms antes de empezar el bump
  animationHold = 800,  // ms que se queda en grande
}) => {
  const items = Array.isArray(elements) ? elements : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const isAnimatingRef = useRef(false);
  const animationTimeoutRef = useRef(null);
  const touchStartPosRef = useRef(0);
  const touchEndPosRef = useRef(0);

  // escala extra para el centro (animación bump)
  const [centerAnimFactor, setCenterAnimFactor] = useState(1);
  // refs para manejar el delay y el hold por separado
  const centerAnimDelayTimeoutRef = useRef(null);
  const centerAnimHoldTimeoutRef = useRef(null);

  // limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (centerAnimDelayTimeoutRef.current) {
        clearTimeout(centerAnimDelayTimeoutRef.current);
      }
      if (centerAnimHoldTimeoutRef.current) {
        clearTimeout(centerAnimHoldTimeoutRef.current);
      }
    };
  }, []);

  const updateCarousel = (newIndex) => {
    if (isAnimatingRef.current) return;

    const length = items.length;
    if (!length) return;

    const normalizedIndex = ((newIndex % length) + length) % length;

    isAnimatingRef.current = true;
    setCurrentIndex(normalizedIndex);

    animationTimeoutRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
    }, 600);
  };

  // Teclas ↑ / ↓ / ← / →
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        updateCarousel(currentIndex - 1);
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        updateCarousel(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, items.length]);

  // Touch (swipe: vertical u horizontal según orientación)
  const handleTouchStart = (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      touchStartPosRef.current =
        orientation === "vertical"
          ? e.changedTouches[0].screenY
          : e.changedTouches[0].screenX;
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      touchEndPosRef.current =
        orientation === "vertical"
          ? e.changedTouches[0].screenY
          : e.changedTouches[0].screenX;
      handleSwipe();
    }
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartPosRef.current - touchEndPosRef.current;
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // hacia arriba / izquierda -> siguiente
        updateCarousel(currentIndex + 1);
      } else {
        // hacia abajo / derecha -> anterior
        updateCarousel(currentIndex - 1);
      }
    }
  };

  // Autoplay (automático)
  useEffect(() => {
    if (!auto) return;
    if (!items.length) return;

    const id = setInterval(() => {
      setCurrentIndex((prev) => {
        const length = items.length;
        if (!length) return 0;
        return (prev + 1) % length;
      });
    }, autoDelay);

    return () => clearInterval(id);
  }, [auto, autoDelay, items.length]);

  const getCardPositionClass = (index) => {
    const length = items.length;
    if (!length) return "isHidden";

    const offset = (index - currentIndex + length) % length;

    if (offset === 0) return "isCenter";
    if (offset === 1) return "isDown1";
    if (offset === 2) return "isDown2";
    if (offset === length - 1) return "isUp1";
    if (offset === length - 2) return "isUp2";
    return "isHidden";
  };

  // Efecto para animar la escala cuando cambia el centro,
  // ahora con DELAY y HOLD configurables.
  useEffect(() => {
    // si no hay animación configurada o es <= 1, regresamos a 1 y listo
    if (!animationScale || animationScale <= 1) {
      setCenterAnimFactor(1);
      return;
    }

    // limpiamos timers anteriores (delay y hold)
    if (centerAnimDelayTimeoutRef.current) {
      clearTimeout(centerAnimDelayTimeoutRef.current);
    }
    if (centerAnimHoldTimeoutRef.current) {
      clearTimeout(centerAnimHoldTimeoutRef.current);
    }

    // al cambiar de slide, empezamos en escala base (sin bump)
    setCenterAnimFactor(1);

    // función que realmente hace el bump
    const startBump = () => {
      setCenterAnimFactor(animationScale);

      // luego de animationHold ms, regresamos a escala base
      centerAnimHoldTimeoutRef.current = setTimeout(() => {
        setCenterAnimFactor(1);
      }, animationHold);
    };

    // si hay delay, esperamos animationDelay ms antes de hacer el bump
    if (animationDelay > 0) {
      centerAnimDelayTimeoutRef.current = setTimeout(() => {
        startBump();
      }, animationDelay);
    } else {
      // sin delay: bump inmediato
      startBump();
    }

    return () => {
      if (centerAnimDelayTimeoutRef.current) {
        clearTimeout(centerAnimDelayTimeoutRef.current);
      }
      if (centerAnimHoldTimeoutRef.current) {
        clearTimeout(centerAnimHoldTimeoutRef.current);
      }
    };
  }, [currentIndex, animationScale, animationDelay, animationHold]);

  // Calcula el transform según posición, orientación y gaps
  const getTransformForPosition = (posClass) => {
    let translateX = 0;
    let translateY = 0;
    let scale = 0.9;
    let translateZ = -200;

    const secondLayerOffset = gapCenter + gapSide;
    const isVertical = orientation === "vertical";

    if (posClass === "isCenter") {
      translateX = 0;
      translateY = 0;
      // escala base * factor de animación (bump)
      scale = centerScale * centerAnimFactor;
      translateZ = 0;
    } else if (posClass === "isUp1") {
      if (isVertical) {
        translateY = -gapCenter;
      } else {
        translateX = -gapCenter;
      }
      scale = 1;
      translateZ = -80;
    } else if (posClass === "isDown1") {
      if (isVertical) {
        translateY = gapCenter;
      } else {
        translateX = gapCenter;
      }
      scale = 1;
      translateZ = -80;
    } else if (posClass === "isUp2") {
      if (isVertical) {
        translateY = -secondLayerOffset;
      } else {
        translateX = -secondLayerOffset;
      }
      scale = 0.9;
      translateZ = -180;
    } else if (posClass === "isDown2") {
      if (isVertical) {
        translateY = secondLayerOffset;
      } else {
        translateX = secondLayerOffset;
      }
      scale = 0.9;
      translateZ = -180;
    }

    return `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) translateZ(${translateZ}px)`;
  };

  // Calcula el blur según la posición y el valor base blur
  const getBlurForPosition = (posClass) => {
    if (!blur || blur <= 0) return 0;

    if (posClass === "isCenter") return 0;
    if (posClass === "isUp1" || posClass === "isDown1") return blur;       // capa 1
    if (posClass === "isUp2" || posClass === "isDown2") return blur * 2;   // capa 2
    return blur * 3;                                                       // resto
  };

  // tamaños normalizados con defaults si no pasas nada
  const finalCardWidth = normalizeSize(cardWidth, "80%");
  const finalCardHeight = normalizeSize(cardHeight, "60%");
  const finalCardMaxWidth = normalizeSize(cardMaxWidth, "420px");
  const finalCardMaxHeight = normalizeSize(cardMaxHeight, "260px");

  return (
    <>
      <style>{styles}</style>

      <div
        className="carouselCards-root"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="carouselCards-track">
          {items.map((node, index) => {
            const posClass = getCardPositionClass(index);
            const transform = getTransformForPosition(posClass);
            const blurPx = getBlurForPosition(posClass);

            return (
              <div
                key={index}
                className={`carouselCards-card ${posClass}`}
                style={{
                  transform,
                  filter: blurPx > 0 ? `blur(${blurPx}px)` : "none",
                  width: finalCardWidth,
                  height: finalCardHeight,
                  maxWidth: finalCardMaxWidth,
                  maxHeight: finalCardMaxHeight,
                }}
                onClick={() => updateCarousel(index)}
              >
                {node}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default CarouselCards;
