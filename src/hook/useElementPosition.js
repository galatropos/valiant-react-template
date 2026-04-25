import { useEffect, useState } from "react";
import getRelativePositionInContainer from "../utils/getRelativePositionInContainer";

function useElementPosition(id) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
  
    useEffect(() => {
      let animationFrameId;
  
      function updatePosition() {
        const el = document.getElementById(id);
        if (!el) return;
  
        const rect = el.getBoundingClientRect();
        const newPos =getRelativePositionInContainer(rect.left, rect.top) ;
        
        setPosition(newPos);
  
        animationFrameId = requestAnimationFrame(updatePosition);
      }
  
      updatePosition();
  
      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }, [id]);
  
    return position;
  }
  
  export default useElementPosition;