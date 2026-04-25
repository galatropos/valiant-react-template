import { useEffect, useRef, useState } from "react";

export default function useOrientation() {
  const isBrowser = typeof window !== "undefined";
  const mqQuery = "(orientation: portrait)";
  const [orientation, setOrientation] = useState(() => {
    if (!isBrowser) return "portrait";
    return window.matchMedia(mqQuery).matches ? "portrait" : "landscape";
  });

  // evita recargas múltiples en algunos navegadores
  const reloadedRef = useRef(false);

  useEffect(() => {
    if (!isBrowser) return;

    const mq = window.matchMedia(mqQuery);
    const onChange = (e) => {
      const next = e.matches ? "portrait" : "landscape";
      setOrientation(next);

      if (!reloadedRef.current) {
        reloadedRef.current = true;
        // pequeño delay para permitir que React termine el tick
        setTimeout(() => {
          // Si usas Next.js (pages): router.reload()
          // Si usas App Router: router.refresh()
          window.location.reload(); 
        }, 50);
      }
    };

    // moderno y fallback
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [isBrowser]);

  return orientation;
}
