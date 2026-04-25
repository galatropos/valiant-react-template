import React, { useState, useEffect } from "react";
import Card from "./Card";
import { useScale } from "../context/contextScale";
import { useElement } from "../context/ContextElement";

const Guide = ({
  id=null,
  loop = true,
  ids = ["a","b","c","d"],
  coords = [
    [0,0],
    [75,50],
    [60,80],
    [10,76],
  ],
  delay = 1000, // tiempo entre movimientos en ms
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guide, setGuide] = useState([[0,0]])
  const lengthGuide = guide.length;
  const { media} = useScale();
  const {element} = useElement();
  

  useEffect(() => {
    if (!loop) return;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % lengthGuide);
    }, delay);
  
    return () => clearTimeout(timer);
  }, [currentIndex, loop, delay, lengthGuide]);

    const [x, y] = guide[currentIndex];
  const seg = delay / 1000;

useEffect(()=>{
  if(ids.length ) {
    if(element){

      setGuide(ids.map((id)=>{
        const {x,y,height,width,anchor}=element[`div_${id}`][media]

switch (anchor) {
  case "left-top":
    return ([x+(width/2),y+(height/2)])
  case "top":
    return ([x,y+(height/2)])
  case "right-top":
    return ([x-(width/2),y+(height/2)])
  case "right":
    return ([x-(width/2),y])
  case "right-bottom":
    return ([x-(width/2),y-(height/2)]) 
  case "bottom":
    return ([x,y-(height/2)])
  case "left-bottom":
    return ([x+(width/2),y-(height/2)])
  case "left":
    return ([x+(width/2),y])
  case "middle":
    return ([x,y])

}
/*
left-top
top
right-top
right
right-bottom
bottom
left-bottom
left
middle
*/


        return ([x,y+(height/2)])
      }))
    } 

  }
  else setGuide(coords)

},[coords.length || ids.length,media])


  return (
    <Card
    id={id}
      portrait={{
        x,
         y,
        anchor: "left-top",
        fontSize: 2.1,
      }}
      landscape={{
        x,
        y,
        width: 10,
        height: 10,
        anchor: "middle",
        fontSize: 2.1,
      }}
      style={{
        border: "1px solid red",
    transition: `all ${seg}s ease`,
      }}
    >
      👆
    </Card>
  );
};

export default Guide;
