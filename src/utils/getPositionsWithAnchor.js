
const getPositionWithAnchor=(xPercent, yPercent, widthPx, heightPx, containerWidth, containerHeight, anchor)=> {
    // Posición base en px (en referencia al contenedor)
    let left = (xPercent / 100) * containerWidth;
    let top = (yPercent / 100) * containerHeight;
  
    switch (anchor) {
      case "left-top":
        // no cambio, referencia es esquina superior izquierda
        break;
  
      case "top":
        left -= widthPx / 2;
        break;
  
      case "right-top":
        left -= widthPx;
        break;
  
      case "right":
        left -= widthPx;
        top -= heightPx / 2;
        break;
  
      case "right-bottom":
        left -= widthPx;
        top -= heightPx;
        break;
  
      case "bottom":
        left -= widthPx / 2;
        top -= heightPx;
        break;
  
      case "left-bottom":
        top -= heightPx;
        break;
  
      case "left":
        top -= heightPx / 2;
        break;
  
      case "middle":
        left -= widthPx / 2;
        top -= heightPx / 2;
        break;
  
      default:
        // fallback a left-top
        break;
    }
  
    return { left, top };
  }

  export default getPositionWithAnchor;