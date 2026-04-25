// Arranca autoplay programático (muted, sin loop) y mantiene el bucle de dibujado
import { useEffect } from "react";
import drawToCanvas from "./drawToCanvas";

export default function useVideoAutoplayAndRender(videoRef, canvasRef, objectFit) {
  useEffect(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;

    let stopped = false;

    const start = async () => {
      try {
        v.muted = true;       // iOS autoplay permitido
        v.loop = false;
        v.playsInline = true;
        v.playbackRate = 1;
        await v.play();
      } catch {}
    };
    start();

    const hasRVFC = typeof v.requestVideoFrameCallback === "function";
    if (hasRVFC) {
      const cb = () => {
        if (stopped) return;
        drawToCanvas(v, c, objectFit);
        v.requestVideoFrameCallback(cb);
      };
      v.requestVideoFrameCallback(cb);
      return () => { stopped = true; };
    }

    let rafId = 0;
    const tick = () => {
      if (stopped) return;
      drawToCanvas(v, c, objectFit);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [videoRef, canvasRef, objectFit]);
}
