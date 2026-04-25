import React, {  useEffect, useState } from "react";
import Card from "../../Card";


const CreateCard = ({ children, xp, yp, xl, yl, wp, hp, par, elements,delayMs,inactiveElement,xpBlock,ypBlock,xlBlock,ylBlock,wl,hl }) => {
    
    const randomIndex = Math.floor(Math.random() * elements.length);
    const [element, setElement] = useState(elements[randomIndex]);
    const [active, setActive] = useState(par);

    useEffect(() => {
        const id = setInterval(() => {
          const randomIndex = Math.floor(Math.random() * elements.length);
          setElement(elements[randomIndex]);
          setActive((e)=>!e);
        }, delayMs);
    
        return () => clearInterval(id);
      }, [elements]);
    
  const configCard = {
    style:{
    },

    portrait: {
      x: xp-xpBlock,
      y: yp-ypBlock,
      anchor: "left-top",
      width: wp,
      height: hp,
    },
    landscape: {
        x: xl-xlBlock,
        y: yl-ylBlock,
        anchor: "left-top",
        width: wl,
        height:hl,
    },
  };
  return <Card {...configCard}>{active? element:inactiveElement }</Card>;
};

const PopBoardShuffle = ({
    elements,
     row= 10,
     col= 7,
     wp= 25,
     hp= 15,
     wl=20,
     hl=25,
     delayMs= 2000,
     xpBlock=50,
     ypBlock=10,
     xlBlock=50,
     ylBlock=50,
     inactiveElement=[]

}) => {


  const total = row * col;
  let rowCont = 0;
  let colCont = -1;
  let par = true;
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
        delayMs={delayMs}
        inactiveElement={inactiveElement}
        xpBlock={xpBlock}
        ypBlock={ypBlock}
        ylBlock={ylBlock}
        xlBlock={xlBlock}
        

      ></CreateCard>
    );
  });

  return <>{card}</>;
};

export default PopBoardShuffle;
