// src/component/video/drawToCanvas.js
// Canvas draw seguro: NO limpia si no hay frame, evita pantallazo negro en pausa.

let _ctxCache = new WeakMap();

export default function drawToCanvas(video, canvas, objectFit = "cover") {
  if (!video || !canvas) return;

  const cw = canvas.clientWidth | 0;
  const ch = canvas.clientHeight | 0;
  if (!cw || !ch) return;

  const dpr = window.devicePixelRatio || 1;
  const W = Math.floor(cw * dpr);
  const H = Math.floor(ch * dpr);
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  let ctx = _ctxCache.get(canvas);
  if (!ctx) {
    // desincronizado: prioriza latencia baja; alpha:false acelera
    ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    _ctxCache.set(canvas, ctx);
  }
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Si no hay frame decodificado, NO limpiar: mantenemos el último frame
  if (video.readyState < 2) return;

  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  const scale =
    objectFit === "contain"
      ? Math.min(cw / vw, ch / vh)
      : Math.max(cw / vw, ch / vh);

  const dw = Math.max(1, Math.floor(vw * scale));
  const dh = Math.max(1, Math.floor(vh * scale));
  const dx = ((cw - dw) / 2) | 0;
  const dy = ((ch - dh) / 2) | 0;

  try {
    // Solo limpiamos cuando realmente vamos a dibujar
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(video, dx, dy, dw, dh);
  } catch {}
}
