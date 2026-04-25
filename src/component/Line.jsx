import { Children, useEffect } from "react";
import useElementPosition from "../hook/useElementPosition";
import usePointerContainer from "../hook/usePointerContainer"
import Card from "./Card"




export  function lineBetweenPoints({ pointA, pointB }) {
    const dx = pointB.x - pointA.x;
    const dy = pointB.y - pointA.y;
    const width = Math.sqrt(dx * dx + dy * dy);
    const rotate =( Math.atan2(dy, dx) * (117 / Math.PI)) ;
    const x = pointA.x;
    const y = pointA.y;
  
    return { width, rotate, x, y };
  }

const StartLine=()=>{


 
    const hand = useElementPosition("hola");

    const pointA = { x: 0, y: 0 };
    const pointB = hand;
      const  position  = usePointerContainer()
      const coordsLine = lineBetweenPoints(
        {
            pointA, pointB
        }
      )
    const styleCard = {
      border: "1px solid blue",
      backgroundColor: "red",
    };

    return <Card
    landscape={{
        ...coordsLine,
      anchor: "left-top",
      height: 0,
    
      

}}
    style={styleCard}
    >
        

    </Card>
}






export default StartLine