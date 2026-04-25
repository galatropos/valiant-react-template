// src/component/effects/stream/StreamMoveVertical.jsx
import React, { useMemo, useState, useCallback } from "react";
import Card from "../../Card";
import useOrientation from "../../../hook/useOrientation";

const StreamMoveVertical = ({
  portrait,
  landscape,
  style,
  elements = [],
  invert = false,
  cycleDelay = 5700,
  durationIn = 350,
  durationOut = 500,
}) => {
  const [index, setIndex] = useState(0);
  const orientation = useOrientation();
  const height = orientation === "portrait" ? portrait.height : landscape.height;

  const styleDefault = useMemo(
    () => ({
      ...style,
      overflow: "hidden",
      backgroundRepeat: "no-repeat",
      backgroundSize: "contain",
      backgroundPosition: "center",
      // ⬇️ centrado del contenido del Card
      display: "grid",
      placeItems: "center",
    }),
    [style]
  );

  // ▶️ Secuencia “sensor”
  const animateMoveObject1 = [
    [{  }, 0],
    [{ y: -5 }, durationIn],
    [{}, cycleDelay],
    [{ y: -5 }, durationOut ],
    [{ y: 0 },300 ],
  ];
  const animateMoveObject2 = [
    [{  }, 0],
    [{ y: 5 }, durationIn],
    [{}, cycleDelay],
    [{ y: +5 }, durationOut ],
    [{ y: 0 },300 ],

  ];
  const animateMoveObject = invert ? animateMoveObject2 : animateMoveObject1;

  // Telones
  const animateIn1 = [
    [{ height:-height,anchor:"top"}, durationIn],//abrir el telon
    [{ y:height,anchor:"bottom"}, 0],//abrir el telon
    [{}, cycleDelay - 100],
    [{height:height,anchor:"bottom"},durationOut],
    [{anchor:"bottom"},400],
 

  ];
  const animateIn2 = [
    [{y:height,anchor:"top"}, 0],//abrir el telon
    [{ height:-height,anchor:"bottom"}, durationIn],//abrir el telon
    [{ height:0,y:-height,}, 0],//abrir el telon
    [{}, cycleDelay - 100],
    [{ height:height,anchor:"top"}, durationOut],//abrir el telon
    [{anchor:"top"},400],



   // [{ y:height,anchor:"bottom"}, 0],//abrir el telon
    //[{}, cycleDelay - 100],
   // [{}, 100],
 //   [{height:height,anchor:"bottom"},durationOut],
    /*
    [{ y: height }, durationIn],
    [{ opacity: 0, y: -height * 2 }, 0],
    [{ opacity: 1 }, 0],
    [{}, cycleDelay - 100],
    [{ y: height }, durationOut],
    [{}, 100],
  */
    ];
  const animateIn = invert ? animateIn2 : animateIn1;

  const configBlankIn = {
    style: { background: "white", border: "1px solid #fff" },
    portrait: { opacity: 1, ...portrait, animate: animateIn,
      anchor:invert?"left-top":"bottom",
      width:200

     },
    landscape: { opacity: 1, ...landscape, animate: animateIn, 
      anchor:invert?"top":"bottom",
      y:invert?landscape.y-height:landscape.y,


    },
    loop: true,
    controlsAnimate: "play",
  };

  const configoOuter1 = {
    style: { background: "white", border: "1px solid #fff" },
    portrait: { opacity: 1, ...portrait, y: portrait.y + height,height:10 },
    landscape: { opacity: 1, ...landscape, 
      y:invert?landscape.y+10 :landscape.y+50,
      height:10 

    },
  };

  const configoOuter2 = {
    style: { background: "white", border: "1px solid #fff" },
    portrait: { opacity: 1, ...portrait, y: portrait.y-10,height:10 },
    landscape: { opacity: 1, ...landscape,
      height:10, 
      y:invert? landscape.y - height : landscape.y-10 
    },
  };

  // Avanza el índice al final del ciclo
  const handleStepChange = useCallback(
    (stepIdx) => {
      if (stepIdx === 4 && elements.length > 0) {
        setIndex((i) => (i + 1) % elements.length);
      }
    },
    [elements.length]
  );

  // Pila montada; cada capa centrada
  const renderStack = (items, active) =>
    items.map((el, i) => {
      const isActive = i === active;
      const child = React.isValidElement(el) ? el : <span>{el}</span>;

      // Si es <img/>, le damos contención para no deformar
      const childIsImg = React.isValidElement(child) && child.type === "img";
      const preparedChild =
        childIsImg
          ? React.cloneElement(child, {
              style: {
                ...(child.props?.style || {}),
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
              },
              draggable: false,
            })
          : child;

      return (
        <div
          key={`stack-${i}`}
          style={{
            position: "absolute",
            inset: 0,
            opacity: isActive ? 1 : 0,
            transition: "opacity 150ms linear",
            pointerEvents: isActive ? "auto" : "none",
            backfaceVisibility: "hidden",
          }}
          data-stack-index={i}
          data-active={isActive ? "1" : "0"}
        >
          {/* Contenedor de centrado */}
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
            }}
          >
            {preparedChild}
          </div>
        </div>
      );
    });

  return (
    <>
      <Card
        style={styleDefault}
        portrait={{ ...portrait, animate: animateMoveObject,
          y:invert?portrait.y-5:portrait.y+5,

         }}
        landscape={{ ...landscape, animate: animateMoveObject,
          y:invert?landscape.y-5:landscape.y+5,
         }}
        loop={true}
        controlsAnimate="play"
        onStepChange={handleStepChange}
      >
        {renderStack(elements, index)}
      </Card>

      <Card {...configoOuter1} />
      <Card {...configoOuter2} />
      <Card {...configBlankIn} />
    </>
  );
};

export default StreamMoveVertical;
