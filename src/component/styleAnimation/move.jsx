// TransitionsMove.jsx
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function TransitionsMove({
  children,
  direction = "right", // left, right, up, down
  spin = false,
  spinDirection = "right", // right, left, top, bottom
  time = 1, // en segundos
  repet = 0, // 0 = infinito
  animation, // booleano de useState externo
  setAnimation, // función para cambiar el estado
}) {
  const [cycleCount, setCycleCount] = useState(0);

  // Distancia de movimiento
  const distance = 100; // px
  const movementMap = {
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
    up: { x: 0, y: -distance },
    down: { x: 0, y: distance },
  };

  // Dirección de rotación en grados
  const spinMap = {
    right: 360,
    left: -360,
    top: -360,
    bottom: 360,
  };

  // Animación principal
  const variants = {
    start: {
      x: 0,
      y: 0,
      rotate: 0,
    },
    move: {
      ...movementMap[direction],
      rotate: spin ? spinMap[spinDirection] : 0,
      transition: {
        duration: time,
        ease: "easeInOut",
        repeat: repet === 0 ? Infinity : repet,
        repeatType: "reverse", // vuelve al inicio
        onRepeat: () => {
          setCycleCount((prev) => prev + 1);
          if (repet !== 0 && cycleCount + 1 >= repet) {
            setAnimation(false); // terminó
          }
        },
      },
    },
  };

  // Escuchar si se inicia o detiene
  useEffect(() => {
    if (!animation) {
      setCycleCount(0); // reset ciclos
    }
  }, [animation]);

  return (
    <motion.div
      variants={variants}
      animate={animation ? "move" : "start"}
      initial="start"
      style={{ display: "inline-block" }}
    >
      {children}
    </motion.div>
  );
}
