import { useState,  useEffect } from "react";

function usePointer(elementId = "container") {

      const [position, setPosition] = useState(null);
    
      useEffect(() => {
        const handleMove = (e) => {
          const el = document.getElementById(elementId);
          if (!el) return;
    
          const rect = el.getBoundingClientRect();
    
          // Calcula porcentaje (puede ser menor a 0 o mayor a 100)
          let x = ((e.clientX - rect.left) / rect.width) * 100;
          let y = ((e.clientY - rect.top) / rect.height) * 100;
    
          // Redondea a dos decimales
          x = parseFloat(x.toFixed(2));
          y = parseFloat(y.toFixed(2));
    
          let area;
          if (y < 33.33) {
            if (x < 33.33) area = "left-top";
            else if (x > 66.66) area = "right-top";
            else area = "top";
          } else if (y > 66.66) {
            if (x < 33.33) area = "left-bottom";
            else if (x > 66.66) area = "right-bottom";
            else area = "bottom";
          } else {
            if (x < 33.33) area = "left";
            else if (x > 66.66) area = "right";
            else area = "middle";
          }
    
          setPosition({  x, y, area });
        };
    
        window.addEventListener("mousemove", handleMove);
    
        return () => {
          window.removeEventListener("mousemove", handleMove);
        };
      }, [elementId]);
    
      return position;
    }
    
  
export default usePointer;