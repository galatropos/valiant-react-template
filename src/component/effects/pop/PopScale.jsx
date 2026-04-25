import React, { useCallback,  useMemo, useState } from "react";
import Card from "../../Card";

const PopScale = ({
  portrait,
  landscape,
  mode,
  style,
  elements = [],
  //intervalChange = 0,
  scale = 0.9,
  guide,
  scaleIn = 0,
  initial = 1000, // ms a esperar antes de la PRIMERA animación
  intervalChange = 0, // ms entre cada animación
}) => {
  const [index, setIndex] = useState(0);
/*este es el original
  const animate =[
      [{  }, intervalChange],
      [{ scale: 0.2 - scaleIn }, 80],
      [{ scale: -0.2 + scaleIn }, 80],
      [{ }, 50],
      [{ scale: 0.2 - scaleIn }, 80],
      [{ scale: -1.3 + scale }, 100],
      [{ }, 0],
      [{ scale: 1.2 - scale }, 100],
      [{ scale: -0.4 + scaleIn }, 80],
      [{ scale: 0.3 - scaleIn }, 100],
    //  [{ scale: -0.9,  }, 300],
    ];
*/
/*
  intervalChange = 0

const animate =[
    [{ scale: 0 }, 0],        // inicio invisible
    [{ scale: 0.02 }, 100],    // arranca suave
    [{ scale: 0.05 }, 50],    // mitad del crecimiento
    [{ scale: 0.08 }, 100],    // casi completo
    [{ scale: 0.1 }, 600],     // llega al 100%
    [{ scale: 0.1 }, 1000],     // se mantiene un poco
    [{ scale: -0.08, opacity:-0.2 }, 200],   // empieza a desaparecer suave
    [{ scale: -0.05, opacity:-0.2}, 300],   // reducción progresiva
    [{ scale: -0.02,opacity:-0.2 }, 400],   // casi oculto
    [{ scale: 0,opacity:-0.4 }, 100],      // desaparece totalmente
    [{  }, 100]      // desaparece totalmente
//  [{ scale: -0.9,  }, 300],
];
*/

const animate =[
  [{ scale: 0.0 }, 100],    // arranca suave
  [{ scale: 0.0 }, 100],    // arranca suave
  [{ scale: 0.6,opacity:1 }, 300],        // inicio invisible
  [{ scale: 0 }, 100],        // inicio invisible
  [{ scale: -0.2 }, 300],        // inicio invisible
  [{ scale: 0.2 }, 300],        // inicio invisible
  [{ scale: 0 }, 1500],        // inicio invisible
  [{ scale: -0.6,opacity:-1 }, 300],        // inicio invisible

//  [{ scale: -0.9,  }, 300],
];

  // Mantengo tu asignación (aunque muta props)
  portrait.scale=0.4;
  landscape.scale=0.4;
  portrait.animate = animate;
  landscape.animate = animate;

const handleStepChange = useCallback(
    (stepIdx) => {
      if (stepIdx === 1 && elements.length > 0) {
        setIndex((i) => (i + 1) % elements.length);
      }
    },)
  return (
    <Card
    mode={mode}
    guide={guide}
      portrait={portrait}
      landscape={landscape}
      style={style}
      loop={true}
      controlsAnimate={ "play"}
      onStepChange={handleStepChange}
    >
      {elements[index]}
    </Card>
  );
};

export default PopScale;
