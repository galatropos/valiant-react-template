import { useEffect } from "react";

function usePreloadBackground(url) {
  useEffect(() => {
    if (!url) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    // Si viene de CDN con CORS:
    // link.crossOrigin = "anonymous";
    // Prioridad (navegadores compatibles)
    link.fetchPriority = "high";
    document.head.appendChild(link);

    // Fallback: fuerza carga a caché también
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = url;

    return () => {
      document.head.removeChild(link);
    };
  }, [url]);
}
export default usePreloadBackground;