// Redibuja al cambiar tamaño del contenedor
import { useEffect } from "react";
import drawToCanvas from "./drawToCanvas";

export default function useResizeRedraw(
  containerRef,
  videoRef,
  canvasRef,
  objectFit
) {
  useEffect(() => {
    if (!containerRef.current) return;

    const handle = () => {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (v && c) drawToCanvas(v, c, objectFit);
    };

    const ro = new ResizeObserver(handle);
    ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, [containerRef, videoRef, canvasRef, objectFit]);
}
