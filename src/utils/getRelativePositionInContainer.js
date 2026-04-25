function getRelativePositionInContainer(pointX, pointY ) {
    const container = document.getElementById("container");
    if (!container) {
      throw new Error(`No se encontró elemento con id ""`);
    }
  
    // Obtener posición y tamaño del container relativo al viewport
    const rect = container.getBoundingClientRect();
  
    // Calcular la posición relativa en porcentaje
    const xPercent = ((pointX - rect.left) / rect.width) * 100;
    const yPercent = ((pointY - rect.top) / rect.height) * 100;
  
    return {
      x: parseFloat(xPercent.toFixed(2)),
      y: parseFloat(yPercent.toFixed(2)),
    };
  }

  export default getRelativePositionInContainer;