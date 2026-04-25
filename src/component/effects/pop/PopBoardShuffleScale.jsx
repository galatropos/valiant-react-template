import React, { useCallback, useEffect, useRef, useState } from "react";
import Card from "../../Card";

// ===================== CreateCard =====================
const CreateCard = ({
  backgrounActive,
  backgrounInactive,
  xp,
  yp,
  xl,
  yl,
  wp,
  hp,
  par,
  elements,
  delayMs,
  xpBlock,
  ypBlock,
  xlBlock,
  ylBlock,
  wl,
  hl,
  stepIdx, // 👈 paso actual de la animación global
  inactiveElement, // 👈 elemento/imagen cuando está oculto
}) => {
  delayMs = 1000;
  const [inactive, setInactive] = useState(true);

  const randomIndex = Math.floor(Math.random() * elements.length);
  const [element, setElement] = useState(elements[randomIndex]);

  // 👉 Usamos stepIdx como DISPARADOR de random
  const [randomTrigger, setRandomTrigger] = useState(0);
  const lastStepRef = useRef(null);

  // 1) Detectar cuándo entrar al step que dispara el random (por ejemplo, step 3)
  useEffect(() => {
    if (stepIdx == null) return;

    const TRIGGER_STEP = 3; // 👈 este paso dispara el random

    const prev = lastStepRef.current;
    lastStepRef.current = stepIdx;

    // Cuando paso de "no estar en step 3" a "estar en step 3" → disparo
    if (stepIdx === TRIGGER_STEP && prev !== TRIGGER_STEP) {
      setRandomTrigger((v) => v + 1);
    }
  }, [stepIdx]);

  // 2) visible → espera → se oculta → (cambia imagen mientras está oculto) → reaparece con la nueva
  useEffect(() => {
    if (!elements || elements.length === 0) return;
    if (randomTrigger === 0) return; // aún no ha disparado

    let hideTimeout;
    let showTimeout;

    // Tiempo visible antes de DESAPARECER
    const hideDelay = Math.floor(Math.random() * 701); // 0..700 ms

    // Tiempo OCULTO antes de volver a aparecer
    const hiddenWait = 500; // ⏳ 500 ms oculto

    // 🔻 Primero se oculta la imagen actual
    hideTimeout = setTimeout(() => {
      setInactive(true); // se oculta (aquí se verá inactiveElement, si lo mandas)

      // 🔁 Mientras está oculta elegimos la NUEVA imagen
      showTimeout = setTimeout(() => {
        const randIdx = Math.floor(Math.random() * elements.length);
        setElement(elements[randIdx]); // aquí cambiamos la imagen estando oculta
        setInactive(false); // 🔺 reaparece ya con la nueva imagen
      }, hiddenWait);
    }, hideDelay);

    return () => {
      clearTimeout(hideTimeout);
      clearTimeout(showTimeout);
    };
  }, [randomTrigger, elements]);

  const configCard = {
    style: {
      // 👇 cuando está inactivo usa backgrounInactive, cuando aparece usa backgrounActive
      backgroundColor: inactive ? backgrounInactive : backgrounActive,
      outline: ` solid 5px ${inactive ? backgrounInactive : backgrounActive}`,
    },
    portrait: {
      x: xp - xpBlock,
      y: yp - ypBlock,
      anchor: "left-top",
      width: wp,
      height: hp,
    },
    landscape: {
      x: xl - xlBlock,
      y: yl - ylBlock,
      anchor: "left-top",
      width: wl,
      height: hl,
    },
  };

  return (
    <Card {...configCard}>
      {/* Si está inactivo, mostramos inactiveElement; si no, el element normal */}
      {inactive ? inactiveElement || null : element}
    </Card>
  );
};

// ===================== PopBoardShuffleScale =====================

const PopBoardShuffleScale = ({
  backgrounActive = "#000",
  backgrounInactive = "#fff",
  elements,
  row = 10,
  col = 10,
  wp = 25,
  hp = 15,
  wl = 20,
  hl = 25,
  delayMs = 9000,
  xpBlock = 50,
  ypBlock = 10,
  xlBlock = 50,
  ylBlock = 50,
  inactiveElement = null, // 👈 aquí mandas la imagen/elemento cuando estén ocultos
  scale = 0.1, // amplitud máxima del “rebote”
  upDurationMs = 1000, // ⏫ tiempo "hacia arriba"
  downDurationMs = 1000, // ⏬ tiempo "hacia abajo" (no se usa aquí todavía)
}) => {
  const total = row * col;
  let rowCont = 0;
  let colCont = -1;
  let par = true;

  const [intervalScale, setIntervalScale] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);

  const card = Array.from({ length: total }, (_, i) => {
    if (colCont === col - 1) {
      colCont = 0;
      rowCont++;
    } else {
      colCont++;
    }

    par = !par;

    return (
      <CreateCard
        backgrounActive={backgrounActive}
        backgrounInactive={backgrounInactive}
        key={i}
        xp={rowCont * wp}
        yp={colCont * hp}
        hp={hp}
        wp={wp}
        xl={rowCont * wl}
        yl={colCont * hl}
        hl={hl}
        wl={wl}
        par={par}
        elements={elements}
        delayMs={1000}
        inactiveElement={inactiveElement} // 👈 se lo pasamos a cada celda
        xpBlock={xpBlock}
        ypBlock={ypBlock}
        ylBlock={ylBlock}
        xlBlock={xlBlock}
        stepIdx={stepIdx}
      />
    );
  });

  useEffect(() => {
    const id = setInterval(() => {
      setIntervalScale((e) => !e);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // ================== ANIMACIÓN MANUAL (SIN for) ==================
  const upStepTime = Math.round(upDurationMs / 10);
  const downStepTime = Math.round(downDurationMs / 10);

  // SUBIDA (igual que tú)
  const fUp = [0.18, 0.16, 0.14, 0.12, 0.1, 0.08, 0.06, 0.06, 0.05, 0.05];
  const fDown = [0.02, 0.03, 0.06, 0.12, 0.17, 0.2, 0.17, 0.12, 0.07, 0.04];

  const upDurationUp = [0.08, 0.07, 0.07, 0.06, 0.06, 0.06, 0.06, 0.06, 0.08, 0.4];
  const downDurationDown = [0.4, 0.08, 0.07, 0.07, 0.06, 0.06, 0.06, 0.06, 0.07, 0.07];

  const animate = [
    // 🔼 SUBIDA (total +scale)
    ...fUp.map((factor, i) => [
      { scale: scale * factor },
      upDurationMs * upDurationUp[i],
    ]),
    // 🔽 BAJADA (total -scale)
    ...fDown.map((factor, i) => [
      { scale: -scale * factor },
      upDurationMs * downDurationDown[i],
    ]),
  ];

  const configCard = {
    portrait: {
      anchor: "middle",
      width: 100,
      height: 100,
      x: 50,
      y: 50,
      rotate: 0,
      animate,
    },
    landscape: {
      anchor: "middle",
      width: 100,
      height: 100,
      x: 50,
      y: 50,
      rotate: 0,
      animate,
    },
    loop: true,
    controlsAnimate: "play",
  };

  const onStepChange = useCallback((idx) => {
    setStepIdx(idx);
  }, []);

  return (
    <>
      <Card {...configCard} onStepChange={onStepChange}>
        <span
          style={{
            position: "fixed",
            transformOrigin: "center center",
            width: "100%",
            height: "100%",
          }}
        >
          {card}
        </span>
      </Card>
    </>
  );
};

export default PopBoardShuffleScale;
